<?php
// 공통: 설정·DB 연결·JSON 응답·id·시각. (잇담 php/api/_lib/core.php 를 바탕으로 테리웰에 맞춤)

declare(strict_types=1);

function config(): array
{
    static $config = null;
    if ($config === null) {
        $file = __DIR__ . '/../config.php';
        if (!is_file($file)) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            exit(json_encode(['error' => 'config.php가 없습니다.']));
        }
        $config = require $file;
    }
    return $config;
}

function cfg(string $key, mixed $default = null): mixed
{
    $value = config()[$key] ?? null;
    return ($value === null || $value === '') ? $default : $value;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $c = config();
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['db_host'], (int) ($c['db_port'] ?? 3306), $c['db_name']);
        $pdo = new PDO($dsn, $c['db_user'], $c['db_password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_STRINGIFY_FETCHES => false,
        ]);
        $pdo->exec("SET time_zone = '+00:00'");
    }
    return $pdo;
}

/** @return array<int, array<string, mixed>> */
function rows(string $sql, array $params = []): array
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st->fetchAll();
}

function row(string $sql, array $params = []): ?array
{
    $st = db()->prepare($sql);
    $st->execute($params);
    $r = $st->fetch();
    return $r === false ? null : $r;
}

function value(string $sql, array $params = []): mixed
{
    $st = db()->prepare($sql);
    $st->execute($params);
    $r = $st->fetchColumn();
    return $r === false ? null : $r;
}

function run(string $sql, array $params = []): int
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st->rowCount();
}

/** @template T @param callable(): T $work @return T */
function transaction(callable $work): mixed
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $r = $work();
        $pdo->commit();
        return $r;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function uuid4(): string
{
    $b = random_bytes(16);
    $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
    $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}

/** 지금 시각, JS Date.toISOString() 형식 (UTC, 밀리초) */
function now_iso(): string
{
    $t = microtime(true);
    return gmdate('Y-m-d\TH:i:s', (int) $t) . sprintf('.%03dZ', (int) (($t - floor($t)) * 1000));
}

/** 한국 날짜 YYYY-MM-DD */
function kst_date(?int $ts = null): string
{
    return gmdate('Y-m-d', ($ts ?? time()) + 9 * 3600);
}

function json_out(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
    exit;
}

/** 오류 응답: 화면은 {error} 를 그대로 보여 준다 */
function fail(string $message, int $status = 400, array $extra = []): never
{
    json_out(['error' => $message] + $extra, $status);
}

function request_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') return [];
    try {
        $d = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        return is_array($d) ? $d : [];
    } catch (JsonException) {
        return [];
    }
}

function str_(mixed $v, int $max = 10000): string
{
    return is_scalar($v) ? mb_substr(trim((string) $v), 0, $max) : '';
}

function site_url(): string
{
    return rtrim((string) cfg('site_url', 'http://localhost:3000'), '/');
}

function is_dev(): bool
{
    return (bool) cfg('dev', false);
}

/** https 로 들어온 요청인지 (Cloudflare·카페24 앞단 프록시의 X-Forwarded-Proto 포함) */
function request_is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https'
        || strtolower((string) ($_SERVER['HTTP_CF_VISITOR'] ?? '')) === '{"scheme":"https"}';
}

/** 사이트 루트 폴더 (www). _storage·uploads 가 이 아래에 있다 */
function www_root(): string
{
    return dirname(__DIR__, 2);
}

function log_error(string $where, Throwable|string $e): void
{
    error_log('[terrywell ' . $where . '] ' . ($e instanceof Throwable ? $e->getMessage() . ' @' . $e->getFile() . ':' . $e->getLine() : $e));
}
