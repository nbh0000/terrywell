<?php
// /api/* 진입점 (.htaccess 가 보낸다). Next.js 서버 액션·API 라우트를 대신한다.

declare(strict_types=1);

require_once __DIR__ . '/_lib/core.php';
require_once __DIR__ . '/_lib/dbapi.php';
require_once __DIR__ . '/_lib/auth.php';
require_once __DIR__ . '/_lib/storage.php';
require_once __DIR__ . '/_lib/snapshot.php';

$route = trim((string) ($_GET['route'] ?? ''), '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    // 간편 로그인은 /auth/oauth/{p}, /auth/callback/{p} 주소로도 들어온다 (.htaccess)
    if (preg_match('#^auth/(oauth|callback)/([a-z]+)$#', $route, $m)) {
        $m[1] === 'oauth' ? oauth_start($m[2]) : oauth_callback($m[2]);
    }
    if (preg_match('#^files/([a-z-]+)/(.+)$#', $route, $m)) {
        serve_file($m[1], $m[2], current_user());
    }

    switch ("$method $route") {
        case 'GET health':
            json_out(['ok' => true, 'php' => PHP_VERSION, 'gd' => extension_loaded('gd'), 'curl' => extension_loaded('curl'), 'imagick' => extension_loaded('imagick'), 'upload_max' => ini_get('upload_max_filesize'), 'post_max' => ini_get('post_max_size')]);

        case 'GET public/snapshot':
            json_out(public_snapshot());

        case 'GET auth/session':
            json_out(session_payload());

        case 'POST auth/login': {
            $b = request_json();
            json_out(auth_login(str_($b['email'] ?? '', 200), (string) ($b['password'] ?? '')) + ['user' => null]);
        }
        case 'POST auth/signup': {
            $b = request_json();
            json_out(auth_signup(str_($b['email'] ?? '', 200), (string) ($b['password'] ?? ''), str_($b['name'] ?? '', 100), str_($b['phone'] ?? '', 30)));
        }
        case 'POST auth/logout':
            clear_session();
            json_out(['ok' => true]);
        case 'POST auth/forgot':
            json_out(auth_forgot(str_(request_json()['email'] ?? '', 200)));
        case 'POST auth/reset': {
            $b = request_json();
            json_out(auth_reset(str_($b['token'] ?? '', 200), (string) ($b['password'] ?? '')));
        }
        case 'POST auth/change-password': {
            $u = require_user();
            $b = request_json();
            json_out(auth_change_password($u['id'], (string) ($b['current'] ?? ''), (string) ($b['password'] ?? '')));
        }

        case 'POST db': {
            $b = request_json();
            $user = current_user();
            if (isset($b['batch']) && is_array($b['batch'])) {
                $out = [];
                foreach ($b['batch'] as $one) $out[] = handle_db_request(is_array($one) ? $one : [], $user);
                json_out(['results' => $out]);
            }
            json_out(['result' => handle_db_request($b, $user)]);
        }

        case 'POST designs/save': {
            $u = require_user();
            require_once __DIR__ . '/_lib/designs.php';
            json_out(save_design($u));
        }

        case 'POST ai/generate': {
            $u = require_user();
            require_once __DIR__ . '/_lib/ai.php';
            handle_ai_generate($u);
        }
        case 'GET ai/me': {
            $u = current_user();
            require_once __DIR__ . '/_lib/ai.php';
            if (!$u) json_out(['loggedIn' => false, 'quota' => null]);
            json_out(['loggedIn' => true, 'quota' => ai_quota($u['id'])]);
        }

        case 'POST orders/create': {
            $u = require_user();
            require_once __DIR__ . '/_lib/orders.php';
            json_out(create_order($u, request_json()));
        }
        case 'POST orders/complete': {
            $u = require_user();
            require_once __DIR__ . '/_lib/orders.php';
            $b = request_json();
            json_out(complete_payment($u, str_($b['orderId'] ?? '', 64), isset($b['paymentId']) && is_string($b['paymentId']) ? $b['paymentId'] : null));
        }
        case 'POST orders/lookup': {
            require_once __DIR__ . '/_lib/orders.php';
            $b = request_json();
            json_out(lookup_order((string) ($b['order_no'] ?? ''), (string) ($b['phone'] ?? '')));
        }
        case 'GET orders/print': {
            require_once __DIR__ . '/_lib/orders.php';
            json_out(print_order(str_($_GET['id'] ?? '', 64), str_($_GET['k'] ?? '', 8), current_user()));
        }
        case 'GET cart': {
            $u = require_user();
            require_once __DIR__ . '/_lib/orders.php';
            $ids = isset($_GET['ids']) && $_GET['ids'] !== '' ? explode(',', (string) $_GET['ids']) : [];
            json_out(load_cart($u['id'], $ids));
        }

        case 'POST quote': {
            require_once __DIR__ . '/_lib/support.php';
            json_out(submit_quote(current_user()));
        }
        case 'POST inquiries': {
            $u = require_user();
            require_once __DIR__ . '/_lib/support.php';
            json_out(create_inquiry($u));
        }
        case 'POST upload': {
            require_admin();
            require_once __DIR__ . '/_lib/support.php';
            json_out(admin_upload());
        }
    }
    fail('Not found', 404);
} catch (Throwable $e) {
    log_error($route, $e);
    fail(is_dev() ? $e->getMessage() : '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', 500);
}
