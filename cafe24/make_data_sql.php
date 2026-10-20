<?php
// 로컬 파일 DB(.data/db.json) → MariaDB INSERT 문 (cafe24/build/data.sql).
//   php cafe24/make_data_sql.php            실서버용: 카탈로그·콘텐츠만 (회원·주문 제외)
//   php cafe24/make_data_sql.php --local    로컬 확인용: 전부 + 로컬 관리자 계정 (.data/admin-login.txt 비밀번호)
// 관리자 계정은 install.php 가 config/secrets 로 따로 만든다.

declare(strict_types=1);

$root = dirname(__DIR__);
require $root . '/php/api/_lib/tables.php';

$local = in_array('--local', $argv, true);
$db = json_decode(file_get_contents("$root/.data/db.json"), true);
if (!is_array($db)) exit("db.json 을 읽지 못했습니다\n");

$catalog = ['categories', 'products', 'product_colors', 'product_price_tiers', 'product_files', 'templates', 'stickers', 'faqs', 'notices', 'site_settings', 'site_contents'];
$userTables = ['profiles', 'designs', 'design_uploads', 'wishlists', 'cart_items', 'orders', 'order_items', 'quote_requests', 'inquiries', 'ai_generations'];
$tablesToExport = $local ? [...$catalog, ...$userTables] : $catalog;

$q = fn (mixed $v): string => $v === null ? 'NULL' : (is_int($v) || is_float($v) ? (string) $v : "'" . str_replace(["\\", "'", "\n", "\r", "\0"], ["\\\\", "\\'", "\\n", "\\r", "\\0"], (string) $v) . "'");

$out = ["-- terrywell data (generated " . gmdate('c') . ($local ? ', local' : ', production') . ")\n"];
foreach ($tablesToExport as $table) {
    $rows = $db[$table] ?? [];
    if (!$rows) continue;
    $cols = array_keys(tables()[$table]['cols']);
    foreach ($rows as $r) {
        $full = [];
        foreach ($cols as $c) {
            $spec = tables()[$table]['cols'][$c];
            $v = $r[$c] ?? null;
            if ($v === null && !str_starts_with($spec, '?')) {
                [$type] = col_type($spec);
                $v = match ($type) { 's', 't' => '', 'i', 'f' => 0, 'b' => false, 'j' => [], 'd' => gmdate('Y-m-d\TH:i:s.v\Z') };
            }
            $full[$c] = encode_col($spec, $v);
        }
        $out[] = "INSERT IGNORE INTO `$table` (`" . implode('`, `', $cols) . '`) VALUES (' . implode(', ', array_map($q, array_values($full))) . ");";
    }
}
if ($local) {
    // 로컬 회원: 비밀번호는 Node scrypt 해시라 PHP 에서 못 쓴다 → 관리자만 admin-login.txt 비밀번호로 다시 만든다
    $login = @file_get_contents("$root/.data/admin-login.txt") ?: '';
    preg_match('/email:\s*(\S+)/', $login, $em);
    preg_match('/password:\s*(\S+)/', $login, $pw);
    foreach ($db['_auth_users'] ?? [] as $u) {
        $hash = ($em[1] ?? '') === $u['email'] && isset($pw[1]) ? password_hash($pw[1], PASSWORD_BCRYPT) : '';
        $sns = $u['sns'] ?? null;
        $out[] = 'INSERT IGNORE INTO `auth_users` (`id`, `email`, `password_hash`, `sns_provider`, `sns_id`) VALUES (' . implode(', ', array_map($q, [$u['id'], $u['email'], $hash, $sns['provider'] ?? null, $sns['id'] ?? null])) . ');';
    }
}
@mkdir("$root/cafe24/build", 0755, true);
file_put_contents("$root/cafe24/build/data.sql", implode("\n", $out) . "\n");
echo count($out) - 1, " statements → cafe24/build/data.sql\n";
