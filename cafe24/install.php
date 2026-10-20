<?php
// 1회용 설치 도구. deploy.py 가 무작위 이름 폴더(/_install_xxxx/)에 schema.sql·data.sql 과 함께 올리고, 끝나면 폴더째 지운다.
// ?step=check    서버 환경·DB 접속 확인 (읽기만)
// ?step=install  테이블을 만들고(있으면 건너뜀), 제품 데이터가 비어 있을 때만 data.sql 을 넣고, 관리자 계정을 만든다(없을 때만)
//   관리자: POST 또는 GET 의 admin_email / admin_password

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$report = ['php' => PHP_VERSION, 'extensions' => [], 'ok' => false];
foreach (['pdo_mysql', 'mbstring', 'fileinfo', 'json', 'gd', 'curl', 'imagick', 'zlib'] as $ext) $report['extensions'][$ext] = extension_loaded($ext);
$report['ini'] = ['upload_max_filesize' => ini_get('upload_max_filesize'), 'post_max_size' => ini_get('post_max_size'), 'memory_limit' => ini_get('memory_limit'), 'max_execution_time' => ini_get('max_execution_time')];

try {
    require dirname(__DIR__) . '/api/_lib/core.php';
    require dirname(__DIR__) . '/api/_lib/tables.php';
    $pdo = db();
    $report['db'] = (string) value('SELECT VERSION()');
    $report['lower_case_table_names'] = (string) value('SELECT @@lower_case_table_names');
    $www = dirname(__DIR__);
    $report['writable'] = ['www' => is_writable($www), 'uploads' => is_dir("$www/uploads") ? is_writable("$www/uploads") : null, '_storage' => is_dir("$www/_storage") ? is_writable("$www/_storage") : null];
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    $report['tables_before'] = count($tables);

    if (($_GET['step'] ?? 'check') === 'install') {
        $exec = function (string $file) use ($pdo): int {
            $n = 0;
            $sql = file_get_contents(__DIR__ . "/$file");
            foreach (preg_split('/;\s*\n/', $sql) as $st) {
                $st = trim(preg_replace('/^--.*$/m', '', $st));
                if ($st === '') continue;
                $pdo->exec($st);
                $n++;
            }
            return $n;
        };
        $report['schema_statements'] = $exec('schema.sql');
        if ((int) value('SELECT COUNT(*) FROM `products`') === 0 && is_file(__DIR__ . '/data.sql')) $report['data_statements'] = $exec('data.sql');
        else $report['data_statements'] = 'skip (데이터 있음)';

        $email = strtolower(trim((string) ($_REQUEST['admin_email'] ?? '')));
        $password = (string) ($_REQUEST['admin_password'] ?? '');
        if ($email !== '' && $password !== '') {
            if (!row('SELECT id FROM auth_users WHERE email = ?', [$email])) {
                $id = uuid4();
                run('INSERT INTO auth_users (id, email, password_hash) VALUES (?, ?, ?)', [$id, $email, password_hash($password, PASSWORD_BCRYPT)]);
                run('INSERT INTO profiles (id, email, name, phone, role, company_name, business_number, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [$id, $email, '관리자', '', 'admin', '', '', gmdate('Y-m-d H:i:s.v')]);
                $report['admin'] = 'created';
            } else {
                run("UPDATE profiles SET role = 'admin' WHERE email = ?", [$email]);
                $report['admin'] = 'exists';
            }
        }
        foreach (['uploads', '_storage'] as $d) {
            if (!is_dir("$www/$d")) @mkdir("$www/$d", 0755, true);
        }
        $report['counts'] = [];
        foreach (['products', 'product_colors', 'templates', 'stickers', 'faqs', 'profiles'] as $t) $report['counts'][$t] = (int) value("SELECT COUNT(*) FROM `$t`");
    }
    $report['ok'] = true;
} catch (Throwable $e) {
    $report['error'] = $e->getMessage();
}
echo json_encode($report, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
