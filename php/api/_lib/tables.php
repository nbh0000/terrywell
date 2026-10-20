<?php
// 표 정의 (src/lib/db/types.ts 와 같은 구조). 스키마 생성·JSON 변환·접근 규칙의 단일 기준.
// 열 타입: s 문자열(191) · t 긴 글 · i 정수 · f 실수 · b 불리언 · j JSON · d 시각(ISO) · 앞에 ? 는 NULL 허용

declare(strict_types=1);

function tables(): array
{
    static $t = null;
    if ($t !== null) return $t;
    $t = [
        'profiles' => ['pk' => ['id'], 'cols' => ['id' => 's', 'email' => 's', 'name' => 's', 'phone' => 's', 'role' => 's', 'company_name' => 's', 'business_number' => 's', 'created_at' => 'd'], 'index' => ['email']],
        'categories' => ['pk' => ['id'], 'cols' => ['id' => 's', 'slug' => 's', 'name' => 's', 'sort_order' => 'i', 'created_at' => 'd'], 'index' => ['slug']],
        'products' => ['pk' => ['id'], 'cols' => [
            'id' => 's', 'slug' => 's', 'name_en' => 's', 'name_ko' => 's', 'category_slugs' => 'j', 'is_visible' => 'b', 'sort_order' => 'i',
            'images' => 'j', 'specs' => 'j', 'spec_note' => 't', 'towel_size' => 's', 'detail_html' => 't', 'detail_images' => 'j', 'notice_html' => 't', 'guide_html' => 't',
            'shipping_info' => 'j', 'base_price' => 'i', 'vat_included' => 'b', 'allow_editor' => 'b', 'allow_upload' => 'b',
            'label_width_mm' => 'f', 'label_height_mm' => 'f', 'label_bleed_mm' => 'f', 'label_safe_mm' => 'f', 'label_corner_mm' => 'f', 'label_pages' => 'i', 'allow_pages' => 'b',
            'qty_step' => 'i', 'released_at' => '?s', 'created_at' => 'd', 'updated_at' => 'd',
        ], 'index' => ['slug']],
        'product_colors' => ['pk' => ['id'], 'cols' => ['id' => 's', 'product_id' => 's', 'name' => 's', 'swatch' => 's', 'images' => 'j', 'mockup_url' => '?s', 'label_x' => 'f', 'label_y' => 'f', 'label_w' => 'f', 'label_rotate' => 'f', 'is_mix' => 'b', 'sort_order' => 'i'], 'index' => ['product_id']],
        'product_price_tiers' => ['pk' => ['id'], 'cols' => ['id' => 's', 'product_id' => 's', 'min_qty' => 'i', 'unit_price' => 'i'], 'index' => ['product_id']],
        'product_files' => ['pk' => ['id'], 'cols' => ['id' => 's', 'product_id' => 's', 'kind' => 's', 'name' => 's', 'url' => 's', 'created_at' => 'd'], 'index' => ['product_id']],
        'templates' => ['pk' => ['id'], 'cols' => ['id' => 's', 'name' => 's', 'category' => 's', 'product_id' => '?s', 'canvas_json' => 'j', 'thumbnail_url' => '?s', 'is_visible' => 'b', 'sort_order' => 'i', 'created_at' => 'd']],
        'stickers' => ['pk' => ['id'], 'cols' => ['id' => 's', 'name' => 's', 'category' => 's', 'url' => 's', 'sort_order' => 'i', 'created_at' => 'd']],
        'designs' => ['pk' => ['id'], 'cols' => ['id' => 's', 'user_id' => 's', 'product_id' => 's', 'color_id' => '?s', 'name' => 's', 'canvas_json' => 'j', 'thumbnail_url' => '?s', 'print_png_url' => '?s', 'print_pdf_url' => '?s', 'print_cmyk_url' => '?s', 'created_at' => 'd', 'updated_at' => 'd'], 'index' => ['user_id']],
        'design_uploads' => ['pk' => ['id'], 'cols' => ['id' => 's', 'user_id' => 's', 'product_id' => 's', 'file_name' => 's', 'file_size' => 'i', 'storage_path' => 's', 'agreed_at' => 's', 'created_at' => 'd'], 'index' => ['user_id']],
        'wishlists' => ['pk' => ['user_id', 'product_id'], 'cols' => ['user_id' => 's', 'product_id' => 's', 'created_at' => 'd']],
        'cart_items' => ['pk' => ['id'], 'cols' => ['id' => 's', 'user_id' => 's', 'product_id' => 's', 'color_id' => '?s', 'design_id' => '?s', 'upload_id' => '?s', 'quantity' => 'i', 'created_at' => 'd'], 'index' => ['user_id']],
        'orders' => ['pk' => ['id'], 'cols' => ['id' => 's', 'order_no' => 's', 'user_id' => 's', 'status' => 's', 'supply_amount' => 'i', 'vat_amount' => 'i', 'total_amount' => 'i', 'shipping_fee' => 'i', 'recipient' => 'j', 'tax_invoice' => '?j', 'payment' => '?j', 'tracking_no' => '?s', 'created_at' => 'd', 'updated_at' => 'd'], 'index' => ['user_id', 'order_no']],
        'order_items' => ['pk' => ['id'], 'cols' => ['id' => 's', 'order_id' => 's', 'product_id' => 's', 'product_name' => 's', 'color_name' => '?s', 'design_id' => '?s', 'upload_id' => '?s', 'quantity' => 'i', 'unit_price' => 'i', 'line_amount' => 'i'], 'index' => ['order_id']],
        'quote_requests' => ['pk' => ['id'], 'cols' => ['id' => 's', 'user_id' => '?s', 'company' => 's', 'name' => 's', 'phone' => 's', 'email' => 's', 'product' => 's', 'quantity' => 's', 'due_date' => 's', 'message' => 't', 'attachments' => 'j', 'status' => 's', 'admin_memo' => 't', 'created_at' => 'd']],
        'notices' => ['pk' => ['id'], 'cols' => ['id' => 's', 'title' => 's', 'body_html' => 't', 'is_pinned' => 'b', 'created_at' => 'd', 'updated_at' => 'd']],
        'faqs' => ['pk' => ['id'], 'cols' => ['id' => 's', 'category' => 's', 'question' => 's', 'answer_html' => 't', 'is_visible' => 'b', 'sort_order' => 'i', 'created_at' => 'd']],
        'inquiries' => ['pk' => ['id'], 'cols' => ['id' => 's', 'user_id' => 's', 'type' => 's', 'order_no' => 's', 'title' => 's', 'body' => 't', 'attachments' => 'j', 'status' => 's', 'answer_html' => 't', 'answered_at' => '?s', 'created_at' => 'd', 'updated_at' => 'd'], 'index' => ['user_id']],
        'ai_generations' => ['pk' => ['id'], 'cols' => ['id' => 's', 'user_id' => 's', 'prompt' => 't', 'style' => 's', 'provider' => 's', 'result_paths' => 'j', 'success' => 'b', 'error' => '?t', 'cost_estimate' => 'i', 'kst_date' => 's', 'created_at' => 'd'], 'index' => ['user_id', 'kst_date']],
        'site_settings' => ['pk' => ['key'], 'cols' => ['key' => 's', 'value' => 'j', 'updated_at' => 'd']],
        'site_contents' => ['pk' => ['key'], 'cols' => ['key' => 's', 'value' => 'j', 'updated_at' => 'd']],
    ];
    return $t;
}

/** 열 타입 (앞의 ? 를 뗀 것)과 NULL 허용 여부 */
function col_type(string $spec): array
{
    $nullable = str_starts_with($spec, '?');
    return [ltrim($spec, '?'), $nullable];
}

function sql_type(string $spec, bool $isPk): string
{
    [$type, $nullable] = col_type($spec);
    $base = match ($type) {
        's' => 'VARCHAR(191)',
        't' => 'LONGTEXT',
        'i' => 'BIGINT',
        'f' => 'DOUBLE',
        'b' => 'TINYINT(1)',
        'j' => 'LONGTEXT',
        'd' => 'DATETIME(3)',
    };
    $null = $nullable && !$isPk ? 'NULL' : 'NOT NULL';
    $default = $isPk || $nullable ? '' : match ($type) {
        's' => " DEFAULT ''",
        't', 'j' => '',
        'i', 'f' => ' DEFAULT 0',
        'b' => ' DEFAULT 0',
        'd' => ' DEFAULT CURRENT_TIMESTAMP(3)',
    };
    return "$base $null$default";
}

/** CREATE TABLE 문 전체 (cafe24/schema.sql 생성과 설치에 쓴다) */
function schema_sql(): string
{
    $out = [];
    $out[] = "CREATE TABLE IF NOT EXISTS `auth_users` (\n  `id` VARCHAR(191) NOT NULL,\n  `email` VARCHAR(191) NOT NULL,\n  `password_hash` VARCHAR(191) NOT NULL DEFAULT '',\n  `sns_provider` VARCHAR(32) NULL,\n  `sns_id` VARCHAR(191) NULL,\n  `reset_token` VARCHAR(191) NULL,\n  `reset_expires` BIGINT NULL,\n  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n  PRIMARY KEY (`id`),\n  UNIQUE KEY `auth_users_email` (`email`),\n  KEY `auth_users_sns` (`sns_provider`, `sns_id`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    foreach (tables() as $name => $def) {
        $lines = [];
        foreach ($def['cols'] as $col => $spec) {
            $lines[] = "  `$col` " . sql_type($spec, in_array($col, $def['pk'], true));
        }
        $lines[] = '  PRIMARY KEY (`' . implode('`, `', $def['pk']) . '`)';
        foreach ($def['index'] ?? [] as $col) {
            $lines[] = "  KEY `{$name}_{$col}` (`$col`)";
        }
        $out[] = "CREATE TABLE IF NOT EXISTS `$name` (\n" . implode(",\n", $lines) . "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    }
    return implode("\n\n", $out) . "\n";
}

/** JS 값 → DB 값 */
function encode_col(string $spec, mixed $v): mixed
{
    [$type, $nullable] = col_type($spec);
    if ($v === null) return $nullable ? null : match ($type) { 's', 't' => '', 'i', 'f', 'b' => 0, 'j' => 'null', 'd' => gmdate('Y-m-d H:i:s.v') };
    return match ($type) {
        's', 't' => (string) $v,
        'i' => (int) (is_numeric($v) ? $v : 0),
        'f' => (float) (is_numeric($v) ? $v : 0),
        'b' => $v ? 1 : 0,
        'j' => json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION),
        'd' => iso_to_db((string) $v),
    };
}

/** DB 값 → JS 값 */
function decode_col(string $spec, mixed $v): mixed
{
    [$type] = col_type($spec);
    if ($v === null) return null;
    return match ($type) {
        's', 't' => (string) $v,
        'i' => (int) $v,
        'f' => (float) $v,
        'b' => (bool) $v,
        'j' => json_decode((string) $v, true),
        'd' => db_to_iso((string) $v),
    };
}

function iso_to_db(string $iso): string
{
    try {
        $d = new DateTimeImmutable($iso);
    } catch (Throwable) {
        return gmdate('Y-m-d H:i:s.v');
    }
    return $d->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s.v');
}

function db_to_iso(string $v): string
{
    $v = strlen($v) === 19 ? "$v.000" : substr($v, 0, 23);
    $d = DateTimeImmutable::createFromFormat('Y-m-d H:i:s.v', $v, new DateTimeZone('UTC'));
    return $d ? $d->format('Y-m-d\TH:i:s.v\Z') : $v;
}

function decode_row(string $table, array $row): array
{
    $cols = tables()[$table]['cols'];
    $out = [];
    foreach ($cols as $col => $spec) {
        if (array_key_exists($col, $row)) $out[$col] = decode_col($spec, $row[$col]);
    }
    return $out;
}

/** 모르는 열은 버리고, 타입에 맞게 바꾼 [열 => 값] */
function encode_fields(string $table, array $fields): array
{
    $cols = tables()[$table]['cols'];
    $out = [];
    foreach ($fields as $col => $v) {
        if (isset($cols[$col])) $out[$col] = encode_col($cols[$col], $v);
    }
    return $out;
}
