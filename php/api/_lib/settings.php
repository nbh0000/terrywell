<?php
// 서버에서도 필요한 사이트 설정 기본값 (src/lib/site.ts DEFAULT_SETTINGS 중 배송·AI). 화면 쪽 기본값과 같게 유지한다.

declare(strict_types=1);

require_once __DIR__ . '/dbapi.php';

const SETTING_DEFAULTS = [
    'shipping' => ['fee' => 3000, 'free_over' => 0],
    'ai' => ['enabled' => true, 'daily_free_limit' => 10, 'styles' => ['일러스트', '미니멀', '수채화', '로고형', '패턴']],
];

function setting(string $key): array
{
    $row = db_get('site_settings', ['key' => $key]);
    $value = is_array($row['value'] ?? null) ? $row['value'] : [];
    return array_merge(SETTING_DEFAULTS[$key] ?? [], $value);
}
