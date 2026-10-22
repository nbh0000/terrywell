<?php
// 견적 문의·1:1 문의 접수(첨부 포함), 관리자 파일 업로드 (src/app/(site)/quote, qna/inquiry, admin/actions.ts)

declare(strict_types=1);

require_once __DIR__ . '/dbapi.php';
require_once __DIR__ . '/storage.php';
require_once __DIR__ . '/auth.php';

const MAX_ATTACH = 20 * 1024 * 1024;
const MAX_ATTACH_COUNT = 5;
const INQUIRY_TYPE_LABELS = ['상품/옵션', '주문/결제', '디자인 확인', '배송/출고', '주문 변경/취소', '증빙서류 (견적서·세금계산서)', '상품·배송 문제', '기타'];

/** $_FILES['files'] (여러 개) → [[name, tmp, size], …] */
function attached_files(string $field = 'files'): array
{
    $f = $_FILES[$field] ?? null;
    if (!is_array($f)) return [];
    $names = is_array($f['name']) ? $f['name'] : [$f['name']];
    $tmps = is_array($f['tmp_name']) ? $f['tmp_name'] : [$f['tmp_name']];
    $sizes = is_array($f['size']) ? $f['size'] : [$f['size']];
    $errors = is_array($f['error']) ? $f['error'] : [$f['error']];
    $out = [];
    foreach ($names as $i => $name) {
        if (($errors[$i] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) continue;
        if (in_array($errors[$i], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) fail('파일 하나당 20MB 이하만 올릴 수 있습니다.');
        if ($errors[$i] !== UPLOAD_ERR_OK || (int) $sizes[$i] <= 0) continue;
        $out[] = ['name' => mb_substr((string) $name, 0, 200), 'tmp' => (string) $tmps[$i], 'size' => (int) $sizes[$i]];
    }
    if (count($out) > MAX_ATTACH_COUNT) fail('첨부 파일은 ' . MAX_ATTACH_COUNT . '개까지 올릴 수 있습니다.');
    foreach ($out as $x) if ($x['size'] > MAX_ATTACH) fail('파일 하나당 20MB 이하만 올릴 수 있습니다.');
    return $out;
}

function store_attachments(array $files, string $prefix): array
{
    $list = [];
    foreach ($files as $f) {
        $path = "$prefix/" . uuid4() . '.' . substr(extension_of($f['name']), 0, 8);
        move_upload_to('uploads', $path, $f['tmp']);
        $list[] = ['name' => $f['name'], 'path' => $path, 'size' => $f['size']];
    }
    return $list;
}

function submit_quote(?array $user): array
{
    $s = fn (string $k, int $n = 200) => mb_substr(trim((string) ($_POST[$k] ?? '')), 0, $n);
    $data = ['company' => $s('company'), 'name' => $s('name'), 'phone' => $s('phone', 30), 'email' => $s('email'), 'product' => $s('product'), 'quantity' => $s('quantity', 30), 'due_date' => $s('due_date', 20), 'message' => $s('message', 3000)];
    if ($data['name'] === '' || $data['phone'] === '' || $data['email'] === '') return ['error' => '이름, 연락처, 이메일을 입력해 주세요.'];
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) return ['error' => '이메일 형식을 확인해 주세요.'];
    if (!preg_match('/^[0-9-+ ]{8,20}$/', $data['phone'])) return ['error' => '연락처를 확인해 주세요.'];
    if (($_POST['agree'] ?? '') !== 'on') return ['error' => '개인정보 수집·이용에 동의해 주세요.'];
    $files = attached_files();
    $id = uuid4();
    $attachments = store_attachments($files, "quotes/$id");
    db_insert('quote_requests', ['id' => $id, 'user_id' => $user['id'] ?? null] + $data + ['attachments' => $attachments, 'status' => 'new', 'admin_memo' => '']);
    notify_admin('새 견적문의', ['id' => $id, 'name' => $data['name'], 'company' => $data['company'], 'product' => $data['product'], 'quantity' => $data['quantity']]);
    return ['ok' => true];
}

function create_inquiry(array $user): array
{
    $s = fn (string $k, int $n = 200) => mb_substr(trim((string) ($_POST[$k] ?? '')), 0, $n);
    $type = $s('type', 60);
    $title = $s('title', 120);
    $body = $s('body', 5000);
    $orderNo = $s('order_no', 40);
    if (!in_array($type, INQUIRY_TYPE_LABELS, true)) return ['error' => '문의 유형을 골라 주세요.'];
    if ($title === '') return ['error' => '문의 제목을 입력해 주세요.'];
    if (mb_strlen($body) < 5) return ['error' => '문의 내용을 조금 더 자세히 적어 주세요.'];
    $files = attached_files();
    $id = uuid4();
    $attachments = store_attachments($files, "{$user['id']}/inquiries/$id");
    db_insert('inquiries', ['id' => $id, 'user_id' => $user['id'], 'type' => $type, 'order_no' => $orderNo, 'title' => $title, 'body' => $body, 'attachments' => $attachments, 'status' => 'waiting', 'answer_html' => '', 'answered_at' => null]);
    notify_admin('새 1:1 문의', ['id' => $id, 'type' => $type, 'title' => $title, 'user' => $user['email']]);
    return ['ok' => true, 'id' => $id];
}

/** 관리자 파일 업로드 (제품 사진·목업·스티커·글꼴·템플릿 썸네일). 공개 버킷만. file 또는 dataUrl */
function admin_upload(): array
{
    $bucket = (string) ($_POST['bucket'] ?? 'product-images');
    if (!in_array($bucket, PUBLIC_BUCKETS, true) || $bucket === 'ai-images') return ['ok' => false, 'error' => '허용되지 않은 위치입니다.'];
    $folder = gmdate('Y-m', time() + 9 * 3600);
    if (!empty($_POST['dataUrl'])) {
        $bytes = data_url_bytes((string) $_POST['dataUrl']);
        $ext = str_contains((string) $_POST['dataUrl'], 'image/jpeg') ? 'jpg' : 'png';
        $url = put_file($bucket, "$folder/" . uuid4() . ".$ext", $bytes);
        return ['ok' => true, 'url' => $url, 'name' => (string) ($_POST['name'] ?? '')];
    }
    $f = $_FILES['file'] ?? null;
    if (!is_array($f) || ($f['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE || (int) ($f['size'] ?? 0) <= 0) return ['ok' => false, 'error' => '파일을 선택해 주세요.'];
    if (in_array($f['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) || (int) $f['size'] > 30 * 1024 * 1024) return ['ok' => false, 'error' => '30MB 이하 파일만 올릴 수 있습니다.'];
    if ($f['error'] !== UPLOAD_ERR_OK) return ['ok' => false, 'error' => '파일을 받지 못했습니다.'];
    $ext = substr(extension_of((string) $f['name']), 0, 8);
    if (in_array($ext, ['php', 'phtml', 'phar', 'cgi', 'pl', 'sh', 'htaccess', 'html', 'js'], true)) return ['ok' => false, 'error' => '허용되지 않은 파일 형식입니다.'];
    $url = move_upload_to($bucket, "$folder/" . uuid4() . ".$ext", (string) $f['tmp_name']);
    return ['ok' => true, 'url' => $url, 'name' => (string) $f['name']];
}

/**
 * 관리자 회원 삭제(탈퇴 처리). 로그인 계정·회원 정보·찜·장바구니·문의·AI 이미지와 주문에 안 쓰인 디자인을 지운다.
 * 주문(결제·배송 기록)과 주문에 쓰인 디자인 파일은 전자상거래법 보관 의무(5년) 때문에 남긴다.
 */
function admin_delete_member(array $admin, string $id): array
{
    $p = db_get('profiles', ['id' => $id]);
    if (!$p) return ['ok' => false, 'error' => '회원을 찾지 못했습니다.'];
    if ($id === $admin['id']) return ['ok' => false, 'error' => '본인 계정은 삭제할 수 없습니다.'];
    if (($p['role'] ?? '') === 'admin') return ['ok' => false, 'error' => '관리자 계정은 삭제할 수 없습니다.'];
    $orderIds = array_column(rows('SELECT id FROM orders WHERE user_id = ?', [$id]), 'id');
    $used = ['design' => [], 'upload' => []];
    if ($orderIds) {
        $in = implode(',', array_fill(0, count($orderIds), '?'));
        foreach (rows("SELECT design_id, upload_id FROM order_items WHERE order_id IN ($in)", $orderIds) as $r) {
            if ($r['design_id']) $used['design'][] = $r['design_id'];
            if ($r['upload_id']) $used['upload'][] = $r['upload_id'];
        }
    }
    $designs = rows('SELECT id FROM designs WHERE user_id = ?', [$id]);
    $uploads = rows('SELECT id, storage_path FROM design_uploads WHERE user_id = ?', [$id]);
    $attached = [];
    foreach (rows('SELECT attachments FROM inquiries WHERE user_id = ?', [$id]) as $r) {
        foreach (json_decode((string) $r['attachments'], true) ?: [] as $a) if (!empty($a['path'])) $attached[] = (string) $a['path'];
    }
    transaction(function () use ($id, $designs, $uploads, $used) {
        foreach (['wishlists', 'cart_items', 'inquiries', 'ai_generations'] as $t) run("DELETE FROM `$t` WHERE user_id = ?", [$id]);
        foreach ($designs as $d) if (!in_array($d['id'], $used['design'], true)) run('DELETE FROM designs WHERE id = ?', [$d['id']]);
        foreach ($uploads as $u) if (!in_array($u['id'], $used['upload'], true)) run('DELETE FROM design_uploads WHERE id = ?', [$u['id']]);
        run('DELETE FROM auth_users WHERE id = ?', [$id]);
        run('DELETE FROM profiles WHERE id = ?', [$id]);
    });
    try {
        foreach ($designs as $d) if (!in_array($d['id'], $used['design'], true)) remove_files('designs', "$id/{$d['id']}");
        foreach ($uploads as $u) if (!in_array($u['id'], $used['upload'], true) && $u['storage_path']) remove_files('uploads', $u['storage_path']);
        foreach ($attached as $path) remove_files('uploads', $path);
        remove_files('ai-images', $id);
    } catch (Throwable $e) {
        log_error('member-delete-files', $e);
    }
    return ['ok' => true, 'keptOrders' => count($orderIds)];
}
