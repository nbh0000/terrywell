<?php
// 파일 저장소 (src/lib/storage.ts 의 로컬 모드와 같은 구조).
//  - 비공개 버킷(designs, uploads): www/_storage/<bucket>/… 에 두고 /api/files/<bucket>/<path> 로 권한 확인 후 내려준다
//  - 공개 버킷(product-images, mockups, templates, ai-images, fonts, stickers): www/uploads/<bucket>/… 를 Apache 가 바로 준다

declare(strict_types=1);

const PRIVATE_BUCKETS = ['designs', 'uploads'];
const PUBLIC_BUCKETS = ['product-images', 'mockups', 'templates', 'ai-images', 'fonts', 'stickers'];

const FILE_TYPES = [
    'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'webp' => 'image/webp', 'gif' => 'image/gif', 'svg' => 'image/svg+xml',
    'pdf' => 'application/pdf', 'tif' => 'image/tiff', 'tiff' => 'image/tiff', 'ai' => 'application/postscript', 'eps' => 'application/postscript',
    'json' => 'application/json', 'woff2' => 'font/woff2', 'woff' => 'font/woff', 'ttf' => 'font/ttf', 'otf' => 'font/otf',
    'zip' => 'application/zip', 'hwp' => 'application/x-hwp', 'doc' => 'application/msword', 'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

function is_private_bucket(string $bucket): bool
{
    return in_array($bucket, PRIVATE_BUCKETS, true);
}

function bucket_dir(string $bucket): string
{
    if (!is_private_bucket($bucket) && !in_array($bucket, PUBLIC_BUCKETS, true)) throw new InvalidArgumentException("알 수 없는 버킷: $bucket");
    return www_root() . (is_private_bucket($bucket) ? '/_storage/' : '/uploads/') . $bucket;
}

/** 버킷 안의 안전한 절대 경로 (.. 금지) */
function storage_path(string $bucket, string $path): string
{
    $path = str_replace('\\', '/', $path);
    if ($path === '' || str_contains($path, '..') || str_contains($path, "\0") || str_starts_with($path, '/')) throw new InvalidArgumentException('잘못된 파일 경로');
    return bucket_dir($bucket) . '/' . $path;
}

function file_url(string $bucket, string $path): string
{
    return (is_private_bucket($bucket) ? '/api/files/' : '/uploads/') . "$bucket/$path";
}

/** 저장하고 사이트에서 쓸 URL 을 돌려준다 */
function put_file(string $bucket, string $path, string $bytes): string
{
    $full = storage_path($bucket, $path);
    $dir = dirname($full);
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) throw new RuntimeException('저장 폴더를 만들 수 없습니다.');
    if (file_put_contents($full, $bytes) === false) throw new RuntimeException('파일을 저장하지 못했습니다.');
    @chmod($full, 0644);
    return file_url($bucket, $path);
}

function move_upload_to(string $bucket, string $path, string $tmp): string
{
    $full = storage_path($bucket, $path);
    $dir = dirname($full);
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) throw new RuntimeException('저장 폴더를 만들 수 없습니다.');
    if (!move_uploaded_file($tmp, $full)) throw new RuntimeException('파일을 저장하지 못했습니다.');
    @chmod($full, 0644);
    return file_url($bucket, $path);
}

/** 접두어로 시작하는 파일 모두 삭제 (디자인 삭제 등) */
function remove_files(string $bucket, string $prefix): void
{
    $dir = storage_path($bucket, rtrim($prefix, '/'));
    if (is_dir($dir)) {
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
        foreach ($it as $f) $f->isDir() ? @rmdir($f->getPathname()) : @unlink($f->getPathname());
        @rmdir($dir);
    } elseif (is_file($dir)) {
        @unlink($dir);
    }
}

function extension_of(string $name): string
{
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    return preg_replace('/[^a-z0-9]/', '', $ext) ?: 'bin';
}

/** /api/files/<bucket>/<path>: 비공개 버킷은 첫 폴더가 본인 id 이거나 관리자일 때만 */
function serve_file(string $bucket, string $path, ?array $user): never
{
    try {
        $full = storage_path($bucket, $path);
    } catch (Throwable) {
        http_response_code(404);
        exit('Not found');
    }
    if (is_private_bucket($bucket)) {
        $owner = explode('/', $path)[0] ?? '';
        if (!$user || ($owner !== $user['id'] && ($user['role'] ?? '') !== 'admin')) {
            http_response_code(403);
            exit('Forbidden');
        }
    }
    if (!is_file($full)) {
        http_response_code(404);
        exit('Not found');
    }
    $ext = extension_of($full);
    header('Content-Type: ' . (FILE_TYPES[$ext] ?? 'application/octet-stream'));
    header('Content-Length: ' . filesize($full));
    header('Cache-Control: ' . (is_private_bucket($bucket) ? 'private, max-age=60' : 'public, max-age=31536000, immutable'));
    if (!empty($_GET['download'])) header('Content-Disposition: attachment; filename="' . rawurlencode(basename($full)) . '"');
    readfile($full);
    exit;
}

/** data:image/png;base64,… → 바이트 */
function data_url_bytes(string $dataUrl): string
{
    if (!preg_match('#^data:[^;,]+;base64,(.*)$#s', $dataUrl, $m)) throw new InvalidArgumentException('잘못된 데이터 URL');
    $b = base64_decode($m[1], true);
    if ($b === false) throw new InvalidArgumentException('잘못된 데이터 URL');
    return $b;
}
