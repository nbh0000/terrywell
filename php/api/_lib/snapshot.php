<?php
// 화면이 처음 열릴 때 필요한 공개 데이터와 로그인 상태. index.php(/api) 와 _page.php(HTML 주입) 가 함께 쓴다.

declare(strict_types=1);

require_once __DIR__ . '/dbapi.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/orders.php';

/** 공개 표 (브라우저 저장소 src/lib/db/http.ts 가 캐시로 쓴다). 관리자 화면은 서버에 직접 묻는다 */
function public_snapshot(): array
{
    return [
        'categories' => db_select('categories', [], [['column' => 'sort_order']]),
        'products' => db_select('products', ['is_visible' => true], [['column' => 'sort_order']]),
        'product_colors' => db_select('product_colors', [], [['column' => 'sort_order']]),
        'product_price_tiers' => db_select('product_price_tiers'),
        'product_files' => db_select('product_files'),
        'templates' => db_select('templates', ['is_visible' => true], [['column' => 'sort_order']]),
        'stickers' => db_select('stickers', [], [['column' => 'sort_order']]),
        'faqs' => db_select('faqs', ['is_visible' => true], [['column' => 'sort_order']]),
        'site_settings' => db_select('site_settings'),
        'site_contents' => db_select('site_contents'),
    ];
}

function session_payload(): array
{
    return ['user' => current_user(), 'oauth' => oauth_status(), 'portone' => portone_config(), 'ai' => ['provider' => strtolower((string) cfg('ai_provider', 'mock'))]];
}
