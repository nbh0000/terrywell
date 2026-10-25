<?php
// 화면 주소 → 정적 HTML (Next.js 빌드 결과). .htaccess 가 실제 파일이 없는 주소를 모두 이리로 보낸다.
// - /products/{slug} 같은 동적 주소는 빌드 때 만든 __live 페이지 파일로 보낸다 (화면이 주소에서 값을 읽는다)
// - 로그인 상태와 공개 데이터를 HTML 에 넣어 보내 첫 화면이 요청 없이 바로 그려진다 (src/lib/db/http.ts)

declare(strict_types=1);

require __DIR__ . '/api/_lib/core.php';
require __DIR__ . '/api/_lib/dbapi.php';
require __DIR__ . '/api/_lib/auth.php';
require __DIR__ . '/api/_lib/snapshot.php';

const LIVE = '__live';
$root = __DIR__;
$path = trim(str_replace('\\', '/', (string) ($_GET['path'] ?? '')), '/');
if (str_contains($path, '..') || str_contains($path, "\0")) not_found($root);
// Next.js 정적 내보내기: 브라우저는 화면 데이터를 __next.a.b.c.txt 로 요청하지만 파일은 __next.a/b/c.txt 로 저장된다
if (preg_match('#^(.*/)?__next\.([^/]+)\.txt$#', $path, $m)) {
    $path = $m[1] . '__next.' . str_replace('.', '/', $m[2]) . '.txt';
}

function not_found(string $root): never
{
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    if (is_file("$root/404.html")) readfile("$root/404.html");
    else echo '<!doctype html><meta charset="utf-8"><title>404</title><p>페이지를 찾을 수 없습니다.';
    exit;
}

function send_file(string $file): never
{
    $types = ['txt' => 'text/plain; charset=utf-8', 'html' => 'text/html; charset=utf-8', 'js' => 'text/javascript', 'css' => 'text/css', 'json' => 'application/json'];
    header('Content-Type: ' . ($types[pathinfo($file, PATHINFO_EXTENSION)] ?? 'application/octet-stream'));
    header('Cache-Control: no-cache');
    readfile($file);
    exit;
}

function send_page(string $file): never
{
    $html = file_get_contents($file);
    try {
        $payload = ['session' => session_payload(), 'data' => public_snapshot(), 'at' => now_iso()];
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_PRESERVE_ZERO_FRACTION);
        $pos = strpos($html, '<head>');
        if ($pos !== false && $json !== false) $html = substr_replace($html, "<script>window.__TW__=$json</script>", $pos + 6, 0);
    } catch (Throwable $e) {
        log_error('_page', $e);
    }
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache');
    echo $html;
    exit;
}

/**
 * 주소에 맞는 빌드 파일을 찾는다. 없으면 마지막 조각을 __live 로 바꿔 가며 찾는다.
 *  products/abc          → products/abc.html 또는 products/__live.html
 *  products/abc.txt      → products/__live.txt (클라이언트 이동용 데이터)
 *  admin/orders/x/__next.… → admin/orders/__live/__next.…
 */
function resolve(string $root, string $path): ?array
{
    if ($path === '' || $path === 'index') return ['page', "$root/index.html"];
    $isTxt = str_ends_with($path, '.txt');
    $isHtml = str_ends_with($path, '.html');
    $base = $isHtml ? substr($path, 0, -5) : $path;
    if (!$isTxt && is_file("$root/$base.html")) return ['page', "$root/$base.html"];
    if ($isTxt && is_file("$root/$path")) return ['file', "$root/$path"];
    $segs = explode('/', $isTxt ? $path : $base);
    // 뒤에서부터 한 조각씩 __live 로 바꿔 본다 (데이터 파일은 __next 조각 앞의 것을 바꾼다)
    for ($i = count($segs) - 1; $i >= 1; $i--) {
        if (str_starts_with($segs[$i], '__next.')) continue;
        $try = $segs;
        // products/abc.txt 처럼 마지막 조각에 .txt 가 붙어 있으면 __live.txt 로 바꾼다
        $try[$i] = $isTxt && $i === count($segs) - 1 && str_ends_with($segs[$i], '.txt') ? LIVE . '.txt' : LIVE;
        $candidate = implode('/', $try);
        if ($isTxt) {
            if (is_file("$root/$candidate")) return ['file', "$root/$candidate"];
        } elseif (is_file("$root/$candidate.html")) {
            return ['page', "$root/$candidate.html"];
        }
    }
    return null;
}

$found = resolve($root, $path);
if ($found === null) not_found($root);
$found[0] === 'page' ? send_page($found[1]) : send_file($found[1]);
