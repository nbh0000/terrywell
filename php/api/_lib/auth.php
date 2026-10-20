<?php
// 회원 인증: 이메일 가입·로그인·비밀번호 재설정, 간편 로그인(카카오·네이버·구글), 서명 쿠키 세션.
// (src/lib/auth.ts 로컬 모드 + src/lib/oauth-server.ts 를 PHP 로 옮김)

declare(strict_types=1);

require_once __DIR__ . '/dbapi.php';

const SESSION_COOKIE = 'tw_session';
const SESSION_DAYS = 14;
const OAUTH_COOKIE = 'tw_oauth';
const OAUTH_PROVIDERS = ['kakao' => '카카오', 'naver' => '네이버', 'google' => 'Google', 'apple' => 'Apple'];

function session_secret(): string
{
    return (string) cfg('session_secret', 'terrywell-dev-only-secret');
}

function sign_payload(string $payload): string
{
    return rtrim(strtr(base64_encode(hash_hmac('sha256', $payload, session_secret(), true)), '+/', '-_'), '=');
}

function cookie_options(int $maxAge, string $path = '/'): array
{
    return [
        'expires' => $maxAge > 0 ? time() + $maxAge : 1,
        'path' => $path,
        'secure' => request_is_https() && !is_dev(),
        'httponly' => true,
        'samesite' => 'Lax',
    ];
}

function write_session(string $userId): void
{
    $exp = (int) (microtime(true) * 1000) + SESSION_DAYS * 86400 * 1000;
    $payload = "$userId.$exp";
    setcookie(SESSION_COOKIE, $payload . '.' . sign_payload($payload), cookie_options(SESSION_DAYS * 86400));
}

function clear_session(): void
{
    setcookie(SESSION_COOKIE, '', cookie_options(0));
}

function session_user_id(): ?string
{
    $raw = $_COOKIE[SESSION_COOKIE] ?? '';
    if ($raw === '') return null;
    $parts = explode('.', $raw);
    if (count($parts) !== 3) return null;
    [$userId, $exp, $sig] = $parts;
    if ($userId === '' || !ctype_digit($exp) || !hash_equals(sign_payload("$userId.$exp"), $sig)) return null;
    if ((float) $exp < microtime(true) * 1000) return null;
    return $userId;
}

/** 로그인한 회원의 profile 행, 없으면 null */
function current_user(): ?array
{
    static $cached = false;
    if ($cached !== false) return $cached;
    $id = session_user_id();
    return $cached = $id ? db_get('profiles', ['id' => $id]) : null;
}

function require_user(): array
{
    $u = current_user();
    if (!$u) fail('로그인이 필요합니다.', 401, ['unauthorized' => true]);
    return $u;
}

function require_admin(): array
{
    $u = require_user();
    if (($u['role'] ?? '') !== 'admin') fail('권한이 없습니다.', 403);
    return $u;
}

// ───────── 이메일 가입·로그인 ─────────

function normalize_email(string $email): string
{
    return strtolower(trim($email));
}

function auth_signup(string $email, string $password, string $name, string $phone): array
{
    $email = normalize_email($email);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return ['ok' => false, 'error' => '이메일 형식을 확인해 주세요.'];
    if (strlen($password) < 8) return ['ok' => false, 'error' => '비밀번호는 8자 이상이어야 합니다.'];
    if (row('SELECT id FROM auth_users WHERE email = ?', [$email])) return ['ok' => false, 'error' => '이미 가입된 이메일입니다.'];
    $id = uuid4();
    transaction(function () use ($id, $email, $password, $name, $phone) {
        run('INSERT INTO auth_users (id, email, password_hash) VALUES (?, ?, ?)', [$id, $email, password_hash($password, PASSWORD_BCRYPT)]);
        db_insert('profiles', ['id' => $id, 'email' => $email, 'name' => $name, 'phone' => $phone, 'role' => 'customer', 'company_name' => '', 'business_number' => '']);
    });
    write_session($id);
    return ['ok' => true];
}

function auth_login(string $email, string $password): array
{
    $email = normalize_email($email);
    $u = row('SELECT * FROM auth_users WHERE email = ?', [$email]);
    if ($u && $u['password_hash'] === '' && $u['sns_provider']) {
        $label = OAUTH_PROVIDERS[$u['sns_provider']] ?? '간편';
        return ['ok' => false, 'error' => "$label 로그인으로 가입한 계정입니다. 아래 간편 로그인 버튼을 눌러 주세요."];
    }
    if (!$u || $u['password_hash'] === '' || !password_verify($password, $u['password_hash'])) return ['ok' => false, 'error' => '이메일 또는 비밀번호가 맞지 않습니다.'];
    if (!db_get('profiles', ['id' => $u['id']])) db_insert('profiles', ['id' => $u['id'], 'email' => $email, 'name' => '', 'phone' => '', 'role' => 'customer']);
    write_session($u['id']);
    return ['ok' => true];
}

/** 비밀번호 재설정 메일. 가입 여부는 알려주지 않는다. 개발 모드에서는 링크를 그대로 돌려준다 */
function auth_forgot(string $email): array
{
    $email = normalize_email($email);
    $u = row('SELECT id FROM auth_users WHERE email = ?', [$email]);
    if (!$u) return ['ok' => true];
    $token = bin2hex(random_bytes(24));
    run('UPDATE auth_users SET reset_token = ?, reset_expires = ? WHERE id = ?', [$token, (int) (microtime(true) * 1000) + 30 * 60 * 1000, $u['id']]);
    $link = site_url() . "/reset-password?token=$token";
    $sent = send_mail($email, '[테리웰] 비밀번호 재설정 안내', "아래 링크를 열어 새 비밀번호를 설정해 주세요. (30분 동안 유효)\n\n$link\n\n본인이 요청하지 않았다면 이 메일은 무시하셔도 됩니다.");
    $out = ['ok' => true];
    if (is_dev() || !$sent) $out['devLink'] = "/reset-password?token=$token";
    return $out;
}

function auth_reset(string $token, string $password): array
{
    if (strlen($password) < 8) return ['ok' => false, 'error' => '비밀번호는 8자 이상이어야 합니다.'];
    $u = $token !== '' ? row('SELECT * FROM auth_users WHERE reset_token = ?', [$token]) : null;
    if (!$u || (int) $u['reset_expires'] < (int) (microtime(true) * 1000)) return ['ok' => false, 'error' => '링크가 만료되었습니다. 다시 요청해 주세요.'];
    run('UPDATE auth_users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?', [password_hash($password, PASSWORD_BCRYPT), $u['id']]);
    return ['ok' => true];
}

/** 로그인 상태에서 비밀번호 바꾸기 (현재 비밀번호 확인) */
function auth_change_password(string $userId, string $current, string $new): array
{
    if (strlen($new) < 8) return ['ok' => false, 'error' => '새 비밀번호는 8자 이상이어야 합니다.'];
    $u = row('SELECT * FROM auth_users WHERE id = ?', [$userId]);
    if (!$u) return ['ok' => false, 'error' => '계정을 찾을 수 없습니다.'];
    if ($u['password_hash'] !== '' && !password_verify($current, $u['password_hash'])) return ['ok' => false, 'error' => '현재 비밀번호가 맞지 않습니다.'];
    run('UPDATE auth_users SET password_hash = ? WHERE id = ?', [password_hash($new, PASSWORD_BCRYPT), $userId]);
    return ['ok' => true];
}

function send_mail(string $to, string $subject, string $body): bool
{
    $from = (string) cfg('mail_from', 'sales@terrywell.kr');
    $headers = "From: =?UTF-8?B?" . base64_encode('테리웰') . "?= <$from>\r\nReply-To: $from\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit";
    try {
        return @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);
    } catch (Throwable $e) {
        log_error('mail', $e);
        return false;
    }
}

/** 관리자 알림 (견적·1:1 문의 접수). 설정에 알림 메일이 있으면 보낸다 */
function notify_admin(string $subject, array $body): void
{
    $to = (string) cfg('notify_email', '');
    if ($to === '') return;
    $lines = [];
    foreach ($body as $k => $v) $lines[] = "$k: " . (is_scalar($v) ? $v : json_encode($v, JSON_UNESCAPED_UNICODE));
    send_mail($to, "[테리웰] $subject", implode("\n", $lines));
}

// ───────── 간편 로그인 ─────────

function oauth_keys(string $p): array
{
    $k = config()['oauth'][$p] ?? [];
    return ['id' => trim((string) ($k['client_id'] ?? '')), 'secret' => trim((string) ($k['client_secret'] ?? ''))];
}

function oauth_fake(): bool
{
    return is_dev() && !empty(config()['oauth_fake']);
}

function oauth_configured(string $p): bool
{
    if ($p === 'apple' || !isset(OAUTH_PROVIDERS[$p])) return false;
    if (oauth_fake()) return true;
    $k = oauth_keys($p);
    return $k['id'] !== '' && $k['secret'] !== '';
}

/** 화면에 알려줄 연결 상태 */
function oauth_status(): array
{
    $out = [];
    foreach (array_keys(OAUTH_PROVIDERS) as $p) $out[$p] = oauth_configured($p);
    return $out;
}

function oauth_redirect_uri(string $p): string
{
    return site_url() . "/auth/callback/$p";
}

function safe_next(?string $n): string
{
    return ($n && str_starts_with($n, '/') && !str_starts_with($n, '//')) ? $n : '/';
}

function redirect_to(string $url): never
{
    header("Location: $url", true, 302);
    header('Cache-Control: no-store');
    exit;
}

function oauth_back(string $provider, string $next, string $reason): never
{
    redirect_to(site_url() . '/login?next=' . rawurlencode($next) . "&sns=$reason&provider=" . rawurlencode($provider));
}

/** 시작: state 쿠키를 쓰고 제공자 로그인 화면으로 */
function oauth_start(string $p): never
{
    $next = safe_next($_GET['next'] ?? null);
    if (!oauth_configured($p)) oauth_back($p, $next, 'unavailable');
    $state = bin2hex(random_bytes(16));
    setcookie(OAUTH_COOKIE, json_encode(['p' => $p, 's' => $state, 'n' => $next]), cookie_options(600, '/'));
    if (oauth_fake()) redirect_to(site_url() . "/auth/callback/$p?code=fake&state=$state");
    $id = oauth_keys($p)['id'];
    $ru = oauth_redirect_uri($p);
    $url = match ($p) {
        'kakao' => 'https://kauth.kakao.com/oauth/authorize?' . http_build_query(['client_id' => $id, 'redirect_uri' => $ru, 'response_type' => 'code', 'state' => $state]),
        'naver' => 'https://nid.naver.com/oauth2.0/authorize?' . http_build_query(['response_type' => 'code', 'client_id' => $id, 'redirect_uri' => $ru, 'state' => $state]),
        'google' => 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query(['client_id' => $id, 'redirect_uri' => $ru, 'response_type' => 'code', 'scope' => 'openid email profile', 'state' => $state, 'prompt' => 'select_account']),
    };
    redirect_to($url);
}

/** 콜백: state 확인 → code 로 회원 정보 → 로그인 */
function oauth_callback(string $p): never
{
    $saved = json_decode((string) ($_COOKIE[OAUTH_COOKIE] ?? ''), true);
    $saved = is_array($saved) ? $saved : [];
    setcookie(OAUTH_COOKIE, '', cookie_options(0, '/'));
    $next = safe_next($saved['n'] ?? null);
    if (!isset(OAUTH_PROVIDERS[$p])) oauth_back($p, $next, 'unavailable');
    if (!empty($_GET['error'])) oauth_back($p, $next, 'cancel');
    $code = (string) ($_GET['code'] ?? '');
    $state = (string) ($_GET['state'] ?? '');
    if ($code === '' || $state === '' || ($saved['p'] ?? '') !== $p || ($saved['s'] ?? '') !== $state) oauth_back($p, $next, 'error');
    try {
        $profile = oauth_fake() ? ['provider' => $p, 'id' => 'fake-1', 'email' => "$p.test@example.com", 'name' => '테스트 회원', 'phone' => ''] : oauth_fetch_profile($p, $code, $state);
        $r = sign_in_with_sns($profile);
        if (!$r['ok']) throw new RuntimeException($r['error']);
    } catch (Throwable $e) {
        log_error("sns $p", $e);
        oauth_back($p, $next, 'error');
    }
    redirect_to(site_url() . $next);
}

function http_post_form(string $url, array $body): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => http_build_query($body), CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded;charset=utf-8']]);
    $res = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    $json = is_string($res) ? json_decode($res, true) : null;
    if ($status >= 300 || !is_array($json) || empty($json['access_token'])) throw new RuntimeException("token $status: " . (string) ($json['error_description'] ?? $json['error'] ?? '실패'));
    return $json;
}

function http_get_json(string $url, array $headers = []): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_HTTPHEADER => $headers]);
    $res = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($status >= 300 || !is_string($res)) throw new RuntimeException("profile $status");
    $json = json_decode($res, true);
    return is_array($json) ? $json : [];
}

function normalize_phone(string $raw): string
{
    if ($raw === '') return '';
    $s = preg_replace('/[^\d+]/', '', $raw) ?? '';
    if (str_starts_with($s, '+82')) $s = '0' . substr($s, 3);
    return preg_replace('/^(\d{3})(\d{3,4})(\d{4})$/', '$1-$2-$3', $s) ?? $s;
}

function oauth_fetch_profile(string $p, string $code, string $state): array
{
    $k = oauth_keys($p);
    $ru = oauth_redirect_uri($p);
    $s = fn ($v) => is_string($v) ? trim($v) : '';
    if ($p === 'kakao') {
        $tok = http_post_form('https://kauth.kakao.com/oauth/token', ['grant_type' => 'authorization_code', 'client_id' => $k['id'], 'client_secret' => $k['secret'], 'redirect_uri' => $ru, 'code' => $code]);
        $me = http_get_json('https://kapi.kakao.com/v2/user/me', ['Authorization: Bearer ' . $tok['access_token']]);
        $acc = is_array($me['kakao_account'] ?? null) ? $me['kakao_account'] : [];
        $pr = is_array($acc['profile'] ?? null) ? $acc['profile'] : [];
        return ['provider' => $p, 'id' => (string) ($me['id'] ?? ''), 'email' => $s($acc['email'] ?? null) ?: null, 'name' => $s($pr['nickname'] ?? null) ?: $s($acc['name'] ?? null), 'phone' => normalize_phone($s($acc['phone_number'] ?? null))];
    }
    if ($p === 'naver') {
        $tok = http_post_form('https://nid.naver.com/oauth2.0/token', ['grant_type' => 'authorization_code', 'client_id' => $k['id'], 'client_secret' => $k['secret'], 'code' => $code, 'state' => $state]);
        $body = http_get_json('https://openapi.naver.com/v1/nid/me', ['Authorization: Bearer ' . $tok['access_token']]);
        $me = is_array($body['response'] ?? null) ? $body['response'] : [];
        if (empty($me['id'])) throw new RuntimeException('naver: ' . ($s($body['message'] ?? null) ?: '회원 정보 없음'));
        return ['provider' => $p, 'id' => (string) $me['id'], 'email' => $s($me['email'] ?? null) ?: null, 'name' => $s($me['name'] ?? null) ?: $s($me['nickname'] ?? null), 'phone' => normalize_phone($s($me['mobile'] ?? null))];
    }
    if ($p === 'google') {
        $tok = http_post_form('https://oauth2.googleapis.com/token', ['grant_type' => 'authorization_code', 'client_id' => $k['id'], 'client_secret' => $k['secret'], 'redirect_uri' => $ru, 'code' => $code]);
        $me = http_get_json('https://www.googleapis.com/oauth2/v3/userinfo', ['Authorization: Bearer ' . $tok['access_token']]);
        return ['provider' => $p, 'id' => (string) ($me['sub'] ?? ''), 'email' => $s($me['email'] ?? null) ?: null, 'name' => $s($me['name'] ?? null), 'phone' => ''];
    }
    throw new RuntimeException("지원하지 않는 제공자: $p");
}

/** SNS 회원 정보로 로그인. 같은 SNS 계정 → 같은 이메일 → 새 회원 순 */
function sign_in_with_sns(array $sns): array
{
    if ($sns['id'] === '') return ['ok' => false, 'error' => '회원 번호 없음'];
    $email = normalize_email($sns['email'] ?? '') ?: "{$sns['provider']}.{$sns['id']}@sns.terrywell.kr";
    $name = $sns['name'] !== '' ? $sns['name'] : (OAUTH_PROVIDERS[$sns['provider']] ?? 'SNS') . ' 회원';
    $u = row('SELECT * FROM auth_users WHERE sns_provider = ? AND sns_id = ?', [$sns['provider'], $sns['id']])
        ?? row('SELECT * FROM auth_users WHERE email = ?', [$email]);
    if (!$u) {
        $id = uuid4();
        transaction(function () use ($id, $email, $sns, $name) {
            run('INSERT INTO auth_users (id, email, password_hash, sns_provider, sns_id) VALUES (?, ?, ?, ?, ?)', [$id, $email, '', $sns['provider'], $sns['id']]);
            db_insert('profiles', ['id' => $id, 'email' => $email, 'name' => $name, 'phone' => $sns['phone'] ?? '', 'role' => 'customer']);
        });
        write_session($id);
        return ['ok' => true];
    }
    if (!$u['sns_provider']) run('UPDATE auth_users SET sns_provider = ?, sns_id = ? WHERE id = ?', [$sns['provider'], $sns['id'], $u['id']]);
    if (!db_get('profiles', ['id' => $u['id']])) db_insert('profiles', ['id' => $u['id'], 'email' => $u['email'], 'name' => $name, 'phone' => $sns['phone'] ?? '', 'role' => 'customer']);
    write_session($u['id']);
    return ['ok' => true];
}
