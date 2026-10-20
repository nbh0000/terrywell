<?php
// 범용 저장소: src/lib/db 의 Db 인터페이스(select·count·get·insert·update·upsert·remove)와 같은 의미.
// 내부(PHP) 에서도 쓰고, POST /api/db 로 화면(브라우저)에서도 쓴다. 화면 요청은 access_rules() 로 권한을 제한한다.

declare(strict_types=1);

require_once __DIR__ . '/tables.php';

// ───────── 내부용 ─────────

function where_sql(string $table, array $where): array
{
    $cols = tables()[$table]['cols'];
    $parts = [];
    $params = [];
    foreach ($where as $col => $v) {
        if (!isset($cols[$col])) throw new InvalidArgumentException("알 수 없는 열: $table.$col");
        if ($v === null) {
            $parts[] = "`$col` IS NULL";
        } else {
            $parts[] = "`$col` = ?";
            $params[] = encode_col($cols[$col], $v);
        }
    }
    return [$parts ? ' WHERE ' . implode(' AND ', $parts) : '', $params];
}

/** @return array<int, array<string, mixed>> */
function db_select(string $table, array $where = [], array $order = [], ?int $limit = null, int $offset = 0): array
{
    [$w, $params] = where_sql($table, $where);
    $cols = tables()[$table]['cols'];
    $o = [];
    foreach ($order as $ord) {
        $col = (string) ($ord['column'] ?? '');
        if (!isset($cols[$col])) continue;
        $o[] = "`$col` " . ((($ord['ascending'] ?? true) === false) ? 'DESC' : 'ASC');
    }
    $sql = "SELECT * FROM `$table`$w" . ($o ? ' ORDER BY ' . implode(', ', $o) : '');
    if ($limit !== null) $sql .= ' LIMIT ' . max(0, $offset) . ', ' . max(0, $limit);
    elseif ($offset > 0) $sql .= ' LIMIT ' . $offset . ', 18446744073709551615';
    return array_map(fn ($r) => decode_row($table, $r), rows($sql, $params));
}

function db_count(string $table, array $where = []): int
{
    [$w, $params] = where_sql($table, $where);
    return (int) value("SELECT COUNT(*) FROM `$table`$w", $params);
}

function db_get(string $table, array $where): ?array
{
    $r = db_select($table, $where, [], 1);
    return $r[0] ?? null;
}

/** id·created_at·updated_at 을 채우고 넣는다. 넣은 행을 돌려준다 */
function db_insert(string $table, array $row): array
{
    $def = tables()[$table];
    $now = now_iso();
    if (isset($def['cols']['id']) && empty($row['id'])) $row['id'] = uuid4();
    if (isset($def['cols']['created_at']) && empty($row['created_at'])) $row['created_at'] = $now;
    if (isset($def['cols']['updated_at']) && empty($row['updated_at'])) $row['updated_at'] = $now;
    // NOT NULL 열은 기본값으로 채운다 (JSON 열은 빈 배열)
    foreach ($def['cols'] as $col => $spec) {
        if (array_key_exists($col, $row)) continue;
        [$type, $nullable] = col_type($spec);
        if ($nullable) { $row[$col] = null; continue; }
        $row[$col] = match ($type) { 's', 't' => '', 'i', 'f' => 0, 'b' => false, 'j' => [], 'd' => $now };
    }
    $enc = encode_fields($table, $row);
    $cols = array_keys($enc);
    $sql = "INSERT INTO `$table` (`" . implode('`, `', $cols) . '`) VALUES (' . implode(', ', array_fill(0, count($cols), '?')) . ')';
    run($sql, array_values($enc));
    $key = [];
    foreach ($def['pk'] as $k) $key[$k] = $row[$k];
    return db_get($table, $key) ?? decode_row($table, $enc);
}

/** 조건에 맞는 행을 고치고, 고친 행들을 돌려준다 */
function db_update(string $table, array $where, array $patch): array
{
    $def = tables()[$table];
    if (isset($def['cols']['updated_at']) && !isset($patch['updated_at'])) $patch['updated_at'] = now_iso();
    foreach ($def['pk'] as $k) unset($patch[$k]);
    $enc = encode_fields($table, $patch);
    if (!$enc) return db_select($table, $where);
    [$w, $params] = where_sql($table, $where);
    $set = implode(', ', array_map(fn ($c) => "`$c` = ?", array_keys($enc)));
    run("UPDATE `$table` SET $set$w", [...array_values($enc), ...$params]);
    return db_select($table, $where);
}

function db_upsert(string $table, array $row, array $onConflict): array
{
    $key = [];
    foreach ($onConflict as $k) $key[$k] = $row[$k] ?? null;
    return transaction(function () use ($table, $row, $key) {
        $existing = db_get($table, $key);
        if ($existing) return db_update($table, $key, $row)[0] ?? $existing;
        return db_insert($table, $row);
    });
}

function db_remove(string $table, array $where): void
{
    [$w, $params] = where_sql($table, $where);
    if ($w === '') throw new InvalidArgumentException('조건 없는 삭제는 허용하지 않는다');
    run("DELETE FROM `$table`$w", $params);
}

// ───────── 화면 요청 (POST /api/db) ─────────

/**
 * 표별 접근 규칙.
 *  read:   public | own | admin      (own = user_id 가 본인인 행만, 관리자는 전체)
 *  public_filter: 비관리자가 읽을 때 강제로 붙는 조건 (숨긴 제품 등)
 *  write:  admin | own | none         (own = 본인 행만 넣고·고치고·지움. user_id 는 서버가 본인으로 맞춘다)
 *  own_fields: own 수정에서 고칠 수 있는 열 (없으면 전부)
 *  own_via: [표, 열] — 그 표의 행이 본인 것이면 읽을 수 있다 (order_items → orders.order_id)
 */
function access_rules(): array
{
    return [
        'profiles' => ['read' => 'own', 'own_col' => 'id', 'write' => 'own', 'own_fields' => ['name', 'phone', 'company_name', 'business_number'], 'no_insert' => true, 'no_delete' => true],
        'categories' => ['read' => 'public', 'write' => 'admin'],
        'products' => ['read' => 'public', 'public_filter' => ['is_visible' => true], 'write' => 'admin'],
        'product_colors' => ['read' => 'public', 'write' => 'admin'],
        'product_price_tiers' => ['read' => 'public', 'write' => 'admin'],
        'product_files' => ['read' => 'public', 'write' => 'admin'],
        'templates' => ['read' => 'public', 'public_filter' => ['is_visible' => true], 'write' => 'admin'],
        'stickers' => ['read' => 'public', 'write' => 'admin'],
        'designs' => ['read' => 'own', 'write' => 'own'],
        'design_uploads' => ['read' => 'own', 'write' => 'own', 'no_insert' => true],
        'wishlists' => ['read' => 'own', 'write' => 'own'],
        'cart_items' => ['read' => 'own', 'write' => 'own'],
        'orders' => ['read' => 'own', 'write' => 'admin'],
        'order_items' => ['read' => 'own', 'own_via' => ['orders', 'order_id'], 'write' => 'admin'],
        'quote_requests' => ['read' => 'admin', 'write' => 'admin'],
        'notices' => ['read' => 'public', 'write' => 'admin'],
        'faqs' => ['read' => 'public', 'public_filter' => ['is_visible' => true], 'write' => 'admin'],
        'inquiries' => ['read' => 'own', 'write' => 'admin'],
        'ai_generations' => ['read' => 'own', 'write' => 'admin'],
        'site_settings' => ['read' => 'public', 'write' => 'admin'],
        'site_contents' => ['read' => 'public', 'write' => 'admin'],
    ];
}

/** 화면에서 온 저장소 요청 하나를 처리해 결과를 돌려준다. $user 는 로그인한 회원(profile) 또는 null */
function handle_db_request(array $req, ?array $user): mixed
{
    $op = (string) ($req['op'] ?? '');
    $table = (string) ($req['table'] ?? '');
    if (!isset(tables()[$table])) fail("알 수 없는 표: $table", 400);
    $rule = access_rules()[$table];
    $isAdmin = $user && ($user['role'] ?? '') === 'admin';
    $where = is_array($req['where'] ?? null) ? $req['where'] : [];
    $ownCol = $rule['own_col'] ?? 'user_id';

    if (in_array($op, ['select', 'count', 'get'], true)) {
        if ($rule['read'] === 'admin' && !$isAdmin) fail('권한이 없습니다.', 403);
        if ($rule['read'] === 'own' && !$isAdmin) {
            if (!$user) fail('로그인이 필요합니다.', 401, ['unauthorized' => true]);
            if (isset($rule['own_via'])) {
                [$parent, $fk] = $rule['own_via'];
                $parentId = $where[$fk] ?? null;
                if (!is_string($parentId) || !db_get($parent, ['id' => $parentId, 'user_id' => $user['id']])) return $op === 'count' ? 0 : ($op === 'get' ? null : []);
            } else {
                $where[$ownCol] = $user['id'];
            }
        }
        if ($rule['read'] === 'public' && !$isAdmin && isset($rule['public_filter'])) {
            foreach ($rule['public_filter'] as $k => $v) $where[$k] = $v;
        }
        $order = is_array($req['order'] ?? null) ? $req['order'] : [];
        $limit = isset($req['limit']) && is_numeric($req['limit']) ? (int) $req['limit'] : null;
        $offset = isset($req['offset']) && is_numeric($req['offset']) ? (int) $req['offset'] : 0;
        return match ($op) {
            'select' => db_select($table, $where, $order, $limit, $offset),
            'count' => db_count($table, $where),
            'get' => db_get($table, $where),
        };
    }

    if (!in_array($op, ['insert', 'update', 'upsert', 'remove'], true)) fail("알 수 없는 요청: $op", 400);
    if (!$user) fail('로그인이 필요합니다.', 401, ['unauthorized' => true]);
    $write = $rule['write'];
    if ($write === 'none' || ($write === 'admin' && !$isAdmin)) fail('권한이 없습니다.', 403);
    $own = $write === 'own' && !$isAdmin;
    $row = is_array($req['row'] ?? null) ? $req['row'] : [];
    $patch = is_array($req['patch'] ?? null) ? $req['patch'] : [];

    if ($own) {
        if (($op === 'insert' || $op === 'upsert') && !empty($rule['no_insert'])) fail('권한이 없습니다.', 403);
        if ($op === 'remove' && !empty($rule['no_delete'])) fail('권한이 없습니다.', 403);
        $row[$ownCol] = $user['id'];
        $where[$ownCol] = $user['id'];
        if (isset($rule['own_fields'])) {
            $patch = array_intersect_key($patch, array_flip($rule['own_fields']));
            $row = array_intersect_key($row, array_flip([...$rule['own_fields'], $ownCol]));
        }
    }
    // 주문에 쓰인 디자인은 인쇄 파일이 필요해서 지우지 않는다
    if ($table === 'designs' && $op === 'remove' && isset($where['id']) && is_string($where['id']) && db_count('order_items', ['design_id' => $where['id']]) > 0) {
        fail('주문에 사용된 디자인은 삭제할 수 없습니다.', 400);
    }
    return match ($op) {
        'insert' => db_insert($table, $row),
        'update' => db_update($table, $where, $patch),
        'upsert' => db_upsert($table, $row, is_array($req['onConflict'] ?? null) ? $req['onConflict'] : tables()[$table]['pk']),
        'remove' => (function () use ($table, $where) { db_remove($table, $where); return null; })(),
    };
}
