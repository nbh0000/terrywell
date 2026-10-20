<?php
// 장바구니 금액 계산·주문 생성·결제 완료(포트원 검증)·비회원 주문 조회
// (src/lib/cart.ts, src/lib/payment.ts, src/app/(site)/checkout/actions.ts, order-lookup/actions.ts)

declare(strict_types=1);

require_once __DIR__ . '/dbapi.php';
require_once __DIR__ . '/settings.php';

const STATUS_LABEL = ['pending' => '결제대기', 'paid' => '결제완료', 'producing' => '제작중', 'shipping' => '배송중', 'done' => '배송완료', 'cancelled' => '취소'];

function unit_price_for(int $qty, array $tiers, int $basePrice): int
{
    usort($tiers, fn ($a, $b) => $b['min_qty'] <=> $a['min_qty']);
    foreach ($tiers as $t) {
        if ($qty >= (int) $t['min_qty']) return (int) $t['unit_price'];
    }
    return $basePrice;
}

function split_vat(int $amount, bool $vatIncluded): array
{
    if ($vatIncluded) {
        $supply = (int) round($amount / 1.1);
        return ['supply' => $supply, 'vat' => $amount - $supply, 'total' => $amount];
    }
    $vat = (int) round($amount * 0.1);
    return ['supply' => $amount, 'vat' => $vat, 'total' => $amount + $vat];
}

function normalize_qty(int $qty, int $step = 1): int
{
    $s = max(1, $step);
    $q = max(0, $qty);
    return min(100000, max($s, (int) ceil($q / $s) * $s));
}

function shipping_fee(int $itemsTotal): int
{
    if ($itemsTotal <= 0) return 0;
    $s = setting('shipping');
    return ((int) $s['free_over'] > 0 && $itemsTotal >= (int) $s['free_over']) ? 0 : (int) $s['fee'];
}

/** 장바구니 줄과 금액 (모두 서버에서 다시 계산) */
function load_cart(string $userId, array $onlyIds = []): array
{
    $items = db_select('cart_items', ['user_id' => $userId], [['column' => 'created_at']]);
    if ($onlyIds) $items = array_values(array_filter($items, fn ($i) => in_array($i['id'], $onlyIds, true)));
    $lines = [];
    foreach ($items as $it) {
        $product = db_get('products', ['id' => $it['product_id']]);
        if (!$product) continue;
        $color = $it['color_id'] ? db_get('product_colors', ['id' => $it['color_id']]) : null;
        $design = $it['design_id'] ? db_get('designs', ['id' => $it['design_id']]) : null;
        $upload = $it['upload_id'] ? db_get('design_uploads', ['id' => $it['upload_id']]) : null;
        $tiers = db_select('product_price_tiers', ['product_id' => $product['id']]);
        $quantity = normalize_qty((int) $it['quantity'], (int) $product['qty_step']);
        $unitPrice = unit_price_for($quantity, $tiers, (int) $product['base_price']);
        $lineAmount = $unitPrice * $quantity;
        $v = split_vat($lineAmount, (bool) $product['vat_included']);
        $lines[] = [
            'id' => $it['id'], 'productId' => $product['id'], 'productSlug' => $product['slug'], 'productName' => $product['name_ko'], 'productNameEn' => $product['name_en'],
            'colorId' => $color['id'] ?? null, 'colorName' => $color['name'] ?? null, 'designId' => $design['id'] ?? null, 'uploadId' => $upload['id'] ?? null,
            'thumbnail' => $design['thumbnail_url'] ?? ($color['images'][1]['url'] ?? ($product['images'][0]['url'] ?? null)),
            'fileName' => $upload['file_name'] ?? null, 'quantity' => $quantity, 'qtyStep' => max(1, (int) $product['qty_step'] ?: 1),
            'unitPrice' => $unitPrice, 'lineAmount' => $lineAmount, 'supply' => $v['supply'], 'vat' => $v['vat'], 'total' => $v['total'],
        ];
    }
    $itemsTotal = array_sum(array_column($lines, 'total'));
    $shipping = shipping_fee($itemsTotal);
    return ['lines' => $lines, 'supply' => array_sum(array_column($lines, 'supply')), 'vat' => array_sum(array_column($lines, 'vat')), 'itemsTotal' => $itemsTotal, 'shipping' => $shipping, 'grandTotal' => $itemsTotal + $shipping];
}

function order_no(): string
{
    return 'TW' . gmdate('ymd', time() + 9 * 3600) . '-' . random_int(100000, 999999);
}

function portone_config(): array
{
    $store = (string) cfg('portone_store_id', '');
    $channel = (string) cfg('portone_channel_key', '');
    $secret = (string) cfg('portone_api_secret', '');
    return ['storeId' => $store, 'channelKey' => $channel, 'mode' => ($store && $channel && $secret) ? 'portone' : 'mock'];
}

/** 주문서 제출: 금액은 서버에서 다시 계산해 '결제대기' 주문을 만든다 */
function create_order(array $user, array $input): array
{
    $r = is_array($input['recipient'] ?? null) ? $input['recipient'] : [];
    $t = is_array($input['taxInvoice'] ?? null) ? $input['taxInvoice'] : [];
    $s = fn ($v, int $n = 200) => mb_substr(trim((string) (is_scalar($v) ? $v : '')), 0, $n);
    $recipient = ['name' => $s($r['name'] ?? ''), 'phone' => $s($r['phone'] ?? ''), 'zip' => $s($r['zip'] ?? ''), 'address1' => $s($r['address1'] ?? ''), 'address2' => $s($r['address2'] ?? ''), 'memo' => $s($r['memo'] ?? '')];
    if ($recipient['name'] === '' || !preg_match('/^[0-9-]{9,14}$/', $recipient['phone']) || $recipient['address1'] === '') return ['ok' => false, 'error' => '받는 분 정보(이름, 연락처, 주소)를 확인해 주세요.'];
    $requested = !empty($t['requested']);
    $tax = null;
    if ($requested) {
        $tax = ['requested' => true, 'company_name' => $s($t['company_name'] ?? ''), 'business_number' => $s($t['business_number'] ?? ''), 'ceo' => $s($t['ceo'] ?? ''), 'email' => $s($t['email'] ?? ''), 'business_type' => $s($t['business_type'] ?? ''), 'business_item' => $s($t['business_item'] ?? '')];
        if ($tax['company_name'] === '' || !preg_match('/^\d{3}-?\d{2}-?\d{5}$/', $tax['business_number']) || $tax['email'] === '') return ['ok' => false, 'error' => '세금계산서 정보(상호, 사업자등록번호, 이메일)를 확인해 주세요.'];
    }
    $ids = is_array($input['itemIds'] ?? null) ? array_values(array_filter($input['itemIds'], 'is_string')) : [];
    $cart = load_cart($user['id'], $ids);
    if (!$cart['lines']) return ['ok' => false, 'error' => '주문할 상품이 없습니다.'];

    $no = order_no();
    $order = transaction(function () use ($cart, $user, $no, $recipient, $tax) {
        $order = db_insert('orders', [
            'order_no' => $no, 'user_id' => $user['id'], 'status' => 'pending',
            'supply_amount' => $cart['supply'], 'vat_amount' => $cart['vat'], 'total_amount' => $cart['grandTotal'], 'shipping_fee' => $cart['shipping'],
            'recipient' => $recipient, 'tax_invoice' => $tax, 'payment' => ['cart_item_ids' => array_column($cart['lines'], 'id')], 'tracking_no' => null,
        ]);
        foreach ($cart['lines'] as $l) {
            db_insert('order_items', ['order_id' => $order['id'], 'product_id' => $l['productId'], 'product_name' => $l['productName'], 'color_name' => $l['colorName'], 'design_id' => $l['designId'], 'upload_id' => $l['uploadId'], 'quantity' => $l['quantity'], 'unit_price' => $l['unitPrice'], 'line_amount' => $l['total']]);
        }
        return $order;
    });
    $n = count($cart['lines']);
    $orderName = $n > 1 ? "{$cart['lines'][0]['productName']} 외 " . ($n - 1) . '건' : $cart['lines'][0]['productName'];
    return ['ok' => true, 'orderId' => $order['id'], 'orderNo' => $no, 'amount' => $cart['grandTotal'], 'orderName' => $orderName, 'mode' => portone_config()['mode']];
}

function verify_portone(string $paymentId, int $expected): array
{
    $ch = curl_init('https://api.portone.io/payments/' . rawurlencode($paymentId));
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_HTTPHEADER => ['Authorization: PortOne ' . cfg('portone_api_secret', '')]]);
    $res = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($status >= 300 || !is_string($res)) return ['ok' => false, 'error' => "결제 조회 실패 ($status)"];
    $p = json_decode($res, true);
    if (!is_array($p)) return ['ok' => false, 'error' => '결제 조회 실패'];
    if (($p['status'] ?? '') !== 'PAID') return ['ok' => false, 'error' => '결제가 완료되지 않았습니다 (' . ($p['status'] ?? '?') . ')'];
    if ((int) ($p['amount']['total'] ?? -1) !== $expected) return ['ok' => false, 'error' => '결제 금액이 주문 금액과 다릅니다.'];
    return ['ok' => true, 'payment' => $p];
}

/** 결제 완료: portone 모드는 단건 조회로 검증, mock 모드는 테스트 결제로 바로 완료. 결제된 장바구니 줄은 지운다 */
function complete_payment(array $user, string $orderId, ?string $paymentId): array
{
    $order = db_get('orders', ['id' => $orderId, 'user_id' => $user['id']]);
    if (!$order) return ['ok' => false, 'error' => '주문을 찾을 수 없습니다.'];
    if ($order['status'] !== 'pending') return ['ok' => true];
    if (portone_config()['mode'] === 'portone') {
        if (!$paymentId) return ['ok' => false, 'error' => '결제 정보가 없습니다.'];
        $v = verify_portone($paymentId, (int) $order['total_amount']);
        if (!$v['ok']) return $v;
        $payment = ['provider' => 'portone', 'paymentId' => $paymentId] + $v['payment'];
    } else {
        $payment = ['provider' => 'mock', 'paymentId' => 'mock-' . $order['order_no'], 'paidAt' => now_iso(), 'note' => '포트원 키 미설정 — 테스트 결제'];
    }
    $cartIds = is_array($order['payment']['cart_item_ids'] ?? null) ? $order['payment']['cart_item_ids'] : [];
    db_update('orders', ['id' => $order['id']], ['status' => 'paid', 'payment' => $payment + ['cart_item_ids' => $cartIds]]);
    foreach ($cartIds as $id) {
        if (is_string($id)) db_remove('cart_items', ['id' => $id, 'user_id' => $user['id']]);
    }
    return ['ok' => true];
}

/** 비회원 주문 조회: 주문번호 + 받는 분 연락처가 모두 맞을 때만 */
function lookup_order(string $no, string $phone): array
{
    $digits = fn (string $s) => preg_replace('/\D/', '', $s) ?? '';
    $no = mb_substr(trim($no), 0, 40);
    $phone = substr($digits($phone), 0, 20);
    if ($no === '' || strlen($phone) < 8) return ['error' => '주문번호와 연락처를 정확히 입력해 주세요.'];
    $order = db_get('orders', ['order_no' => $no]);
    if (!$order || $order['status'] === 'pending' || $digits((string) ($order['recipient']['phone'] ?? '')) !== $phone) return ['error' => '일치하는 주문이 없습니다. 주문번호와 연락처를 다시 확인해 주세요.'];
    $items = db_select('order_items', ['order_id' => $order['id']]);
    $d = new DateTimeImmutable($order['created_at']);
    $d = $d->setTimezone(new DateTimeZone('Asia/Seoul'));
    return ['order' => [
        'id' => $order['id'], 'no' => $order['order_no'], 'date' => $d->format('Y. n. j.'), 'status' => STATUS_LABEL[$order['status']] ?? $order['status'],
        'tracking' => $order['tracking_no'], 'total' => (int) $order['total_amount'], 'key' => substr($phone, -4),
        'items' => array_map(fn ($it) => ['name' => $it['product_name'], 'color' => $it['color_name'], 'quantity' => (int) $it['quantity'], 'amount' => (int) $it['line_amount']], $items),
    ]];
}

/** 견적서·거래명세서 데이터. 본인 주문·관리자, 또는 주문번호 조회(연락처 뒷자리 k)로 연 경우 */
function print_order(string $id, string $k, ?array $user): array
{
    $order = db_get('orders', ['id' => $id]);
    if (!$order) fail('주문을 찾을 수 없습니다.', 404);
    $phoneKey = substr(preg_replace('/\D/', '', (string) ($order['recipient']['phone'] ?? '')) ?? '', -4);
    $allowed = ($user && ($user['id'] === $order['user_id'] || ($user['role'] ?? '') === 'admin')) || ($k !== '' && strlen($phoneKey) === 4 && hash_equals($phoneKey, $k));
    if (!$allowed) fail('권한이 없습니다.', 403);
    $buyer = db_get('profiles', ['id' => $order['user_id']]);
    $companyRow = db_get('site_settings', ['key' => 'company']);
    return [
        'order' => $order,
        'items' => db_select('order_items', ['order_id' => $order['id']]),
        'company' => is_array($companyRow['value'] ?? null) ? $companyRow['value'] : new stdClass(),
        'buyer' => $buyer ? ['name' => $buyer['name'], 'company_name' => $buyer['company_name']] : null,
    ];
}
