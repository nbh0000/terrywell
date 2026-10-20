<?php
// AI 이미지 생성 (src/app/api/ai/generate/route.ts + src/lib/ai). 서버에서만 키를 쓴다.
// 제공자: mock(GD 그림) · openai(gpt-image-1.5) · google(gemini-nano-banana-2.1). 하루 무료 횟수는 ai_generations 로 센다.

declare(strict_types=1);

require_once __DIR__ . '/dbapi.php';
require_once __DIR__ . '/storage.php';
require_once __DIR__ . '/settings.php';

function ai_quota(string $userId): array
{
    $ai = setting('ai');
    $used = db_count('ai_generations', ['user_id' => $userId, 'kst_date' => kst_date(), 'success' => true]);
    $limit = (int) $ai['daily_free_limit'];
    return ['enabled' => (bool) $ai['enabled'], 'limit' => $limit, 'used' => $used, 'remaining' => max(0, $limit - $used), 'styles' => $ai['styles']];
}

function ai_provider_name(): string
{
    return strtolower((string) cfg('ai_provider', 'mock'));
}

function ai_cost_per_image(): int
{
    $c = cfg('ai_cost_per_image_krw');
    if ($c !== null) return (int) $c;
    return match (ai_provider_name()) { 'openai' => 70, 'google' => 47, default => 0 };
}

function build_prompt(string $prompt, string $style): string
{
    $s = $style !== '' ? "Style: $style. " : '';
    return "{$s}Design for a small woven towel label, clean composition, no text, no watermark, print-ready illustration. $prompt";
}

/** @return string[] PNG 바이트 목록 */
function ai_generate(string $prompt, string $style, int $count): array
{
    return match (ai_provider_name()) {
        'openai' => ai_openai($prompt, $style, $count),
        'google' => ai_google($prompt, $style, $count),
        default => ai_mock($prompt, $style, $count),
    };
}

function ai_mock(string $prompt, string $style, int $count): array
{
    $out = [];
    for ($i = 0; $i < $count; $i++) {
        $w = 1200;
        $h = 800;
        $img = imagecreatetruecolor($w, $h);
        $hue = (crc32($prompt . $i) % 360) / 360;
        [$r, $g, $b] = hsl_to_rgb($hue, 0.35, 0.88);
        imagefilledrectangle($img, 0, 0, $w, $h, imagecolorallocate($img, $r, $g, $b));
        mt_srand(crc32($prompt . $style . $i));
        for ($k = 0; $k < 7; $k++) {
            [$r2, $g2, $b2] = hsl_to_rgb(fmod($hue + 0.08 * $k, 1.0), 0.5, 0.55);
            $c = imagecolorallocatealpha($img, $r2, $g2, $b2, 40);
            $cx = mt_rand(100, $w - 100);
            $cy = mt_rand(100, $h - 100);
            $rad = mt_rand(80, 260);
            $k % 2 ? imagefilledellipse($img, $cx, $cy, $rad, $rad, $c) : imagefilledrectangle($img, (int) ($cx - $rad / 2), (int) ($cy - $rad / 2), (int) ($cx + $rad / 2), (int) ($cy + $rad / 2), $c);
        }
        $text = 'MOCK ' . ($style !== '' ? "· $style" : '');
        imagestring($img, 5, (int) ($w / 2 - strlen($text) * 4.5), $h - 40, $text, imagecolorallocatealpha($img, 0, 0, 0, 80));
        ob_start();
        imagepng($img);
        $out[] = (string) ob_get_clean();
        imagedestroy($img);
    }
    return $out;
}

function hsl_to_rgb(float $h, float $s, float $l): array
{
    $f = function (float $n) use ($h, $s, $l): int {
        $k = fmod($n + $h * 12, 12);
        $a = $s * min($l, 1 - $l);
        return (int) round(255 * ($l - $a * max(-1, min($k - 3, 9 - $k, 1))));
    };
    return [$f(0), $f(8), $f(4)];
}

function ai_http_json(string $url, array $headers, array $body, int $timeout = 120): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($body), CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $timeout, CURLOPT_HTTPHEADER => [...$headers, 'Content-Type: application/json']]);
    $res = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if (!is_string($res)) throw new RuntimeException("요청 실패: $err");
    $json = json_decode($res, true);
    if ($status >= 300) throw new RuntimeException("API 오류 ($status): " . substr((string) ($json['error']['message'] ?? $res), 0, 300));
    return is_array($json) ? $json : [];
}

function ai_openai(string $prompt, string $style, int $count): array
{
    $key = (string) cfg('openai_api_key', '');
    if ($key === '') throw new RuntimeException('OPENAI 키가 설정되지 않았습니다.');
    $json = ai_http_json('https://api.openai.com/v1/images/generations', ["Authorization: Bearer $key"], [
        'model' => (string) cfg('openai_image_model', 'gpt-image-1.5'), 'prompt' => build_prompt($prompt, $style), 'size' => '1536x1024', 'quality' => 'medium', 'n' => $count,
    ]);
    $out = [];
    foreach ($json['data'] ?? [] as $d) {
        if (!empty($d['b64_json'])) $out[] = base64_decode($d['b64_json']);
    }
    if (!$out) throw new RuntimeException('OpenAI 응답에 이미지가 없습니다.');
    return $out;
}

/** Gemini 이미지 생성(generateContent). 장수만큼 호출한다 */
function ai_google(string $prompt, string $style, int $count): array
{
    $key = (string) cfg('google_api_key', '');
    if ($key === '') throw new RuntimeException('GOOGLE 키가 설정되지 않았습니다.');
    $model = (string) cfg('google_image_model', 'gemini-nano-banana-2.1');
    $out = [];
    for ($i = 0; $i < $count; $i++) {
        $json = ai_http_json("https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent", ["x-goog-api-key: $key"], [
            'contents' => [['parts' => [['text' => build_prompt($prompt, $style)]]]],
            'generationConfig' => ['responseModalities' => ['IMAGE'], 'imageConfig' => ['aspectRatio' => '4:3']],
        ]);
        foreach ($json['candidates'][0]['content']['parts'] ?? [] as $part) {
            if (!empty($part['inlineData']['data'])) {
                $out[] = base64_decode($part['inlineData']['data']);
                break;
            }
        }
    }
    if (!$out) throw new RuntimeException('Google 응답에 이미지가 없습니다.');
    return $out;
}

/** 같은 회원의 동시 요청으로 한도를 넘지 않게 파일 잠금으로 직렬화한다 */
function ai_lock(string $userId): mixed
{
    $dir = www_root() . '/_storage/locks';
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    $fh = fopen("$dir/ai-" . preg_replace('/[^a-z0-9-]/i', '', $userId) . '.lock', 'c');
    if ($fh && !flock($fh, LOCK_EX | LOCK_NB)) fail('이전 생성이 끝난 뒤 다시 시도해 주세요.', 429);
    return $fh;
}

function handle_ai_generate(array $user): never
{
    $body = request_json();
    $prompt = mb_substr(trim((string) ($body['prompt'] ?? '')), 0, 500);
    $style = mb_substr(trim((string) ($body['style'] ?? '')), 0, 30);
    if (mb_strlen($prompt) < 2) fail('만들고 싶은 그림을 입력해 주세요.');
    $lock = ai_lock($user['id']);
    $quota = ai_quota($user['id']);
    if (!$quota['enabled']) fail('지금은 AI 생성을 사용할 수 없습니다.', 403);
    if ($quota['remaining'] <= 0) fail('오늘 무료 생성 횟수를 모두 사용했습니다.', 429, ['quota' => $quota]);
    $count = max(1, min(4, (int) cfg('ai_images_per_request', 2)));
    $id = uuid4();
    $provider = ai_provider_name();
    try {
        $images = ai_generate($prompt, $style, $count);
        $urls = [];
        foreach ($images as $i => $bytes) $urls[] = put_file('ai-images', "{$user['id']}/$id-$i.png", $bytes);
        db_insert('ai_generations', ['id' => $id, 'user_id' => $user['id'], 'prompt' => $prompt, 'style' => $style, 'provider' => $provider, 'result_paths' => $urls, 'success' => true, 'error' => null, 'cost_estimate' => ai_cost_per_image() * count($urls), 'kst_date' => kst_date()]);
        json_out(['images' => $urls, 'quota' => ['enabled' => true, 'limit' => $quota['limit'], 'used' => $quota['used'] + 1, 'remaining' => $quota['remaining'] - 1, 'styles' => $quota['styles']]]);
    } catch (Throwable $e) {
        log_error('ai', $e);
        db_insert('ai_generations', ['id' => $id, 'user_id' => $user['id'], 'prompt' => $prompt, 'style' => $style, 'provider' => $provider, 'result_paths' => [], 'success' => false, 'error' => mb_substr($e->getMessage(), 0, 500), 'cost_estimate' => 0, 'kst_date' => kst_date()]);
        fail('이미지를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.', 502, ['quota' => $quota]);
    } finally {
        if ($lock) { flock($lock, LOCK_UN); fclose($lock); }
    }
}
