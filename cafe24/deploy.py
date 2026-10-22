"""카페24(뉴아우토반 비즈니스, 아이디 terrywell)에 FTP 로 배포한다. 접속 정보는 cafe24/secrets.txt.

단계 (처음 배포는 순서대로 전부):
  python cafe24/deploy.py preflight   임시 폴더에 .htaccess·PHP 시험 파일을 올려 서버 설정(재작성·PHP 확장·업로드 한도)을 확인하고 지운다
  python cafe24/deploy.py backend     PHP(API·.htaccess·_page.php)·config.php 를 올리고 DB 테이블·기본 데이터·관리자 계정을 만든다
  python cafe24/deploy.py site        정적 빌드(실서버 주소) → 전체 업로드, 지난 배포에서 사라진 파일 정리
  python cafe24/deploy.py php         PHP 코드만 다시 올린다 (DB 그대로)
  python cafe24/deploy.py config      secrets.txt 로 api/config.php 만 다시 만든다 (키 추가·변경 시)
  python cafe24/deploy.py check       실서버 /api/health 와 첫 화면 확인
이후 업데이트는 보통 `site` (PHP 를 고쳤으면 `php` 도).
서버의 uploads/, _storage/, api/config.php 는 지우거나 덮어쓰지 않는다.
"""

import ftplib
import io
import json
import secrets as random
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CAFE24 = ROOT / "cafe24"
WWW = CAFE24 / "build" / "www"
MANIFEST = CAFE24 / "build" / "deployed-manifest.json"
SECRETS_FILE = CAFE24 / "secrets.txt"
PHP = Path("C:/Users/pc/.itdam-php/php/php.exe")


def load_secrets() -> dict[str, str]:
    return dict(line.split("=", 1) for line in SECRETS_FILE.read_text(encoding="utf-8").splitlines() if "=" in line and not line.startswith("#"))


S = load_secrets()
SITE = S.get("SITE_URL", "https://terrywell.kr")
FTP_HOST = S.get("FTP_IP") or S["FTP_SSH_HOST"]


def http(url: str, data: bytes | None = None) -> tuple[int, str]:
    """서버 IP 로 직접 부를 때는 Host 헤더로 도메인을 알려 준다 (같은 IP 에 여러 사이트가 있다)."""
    headers = {"User-Agent": "terrywell-deploy"}
    if url.startswith(f"http://{FTP_HOST}"):
        headers["Host"] = S["FTP_SSH_HOST"]
    try:
        req = urllib.request.Request(url, data=data, headers=headers)
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except Exception as e:  # noqa: BLE001
        return 0, str(e)


def origin() -> str:
    """https 가 아직 안 되면(네임서버 전) 서버 IP 로 직접 확인한다."""
    for base in (SITE, f"http://{S['FTP_SSH_HOST']}", f"http://{FTP_HOST}"):
        status, _ = http(f"{base}/api/health")
        if status == 200:
            return base
    return f"http://{FTP_HOST}"


def connect() -> ftplib.FTP:
    ftp = ftplib.FTP(FTP_HOST, timeout=60, encoding="utf-8")
    ftp.login(S["FTP_SSH_USER"], S["FTP_SSH_PASSWORD"])
    # 카페24 FTP 홈 아래 www 가 문서 루트
    try:
        ftp.cwd("www")
    except ftplib.error_perm:
        pass
    return ftp


def ensure_dir(ftp: ftplib.FTP, remote_dir: str, made: set[str]) -> None:
    parts = [p for p in remote_dir.split("/") if p]
    for i in range(1, len(parts) + 1):
        path = "/".join(parts[:i])
        if path in made:
            continue
        try:
            ftp.mkd(path)
        except ftplib.error_perm:
            pass
        made.add(path)


def upload(ftp: ftplib.FTP, local: Path, remote: str, made: set[str]) -> None:
    if "/" in remote:
        ensure_dir(ftp, remote.rsplit("/", 1)[0], made)
    with local.open("rb") as handle:
        ftp.storbinary(f"STOR {remote}", handle)


def upload_bytes(ftp: ftplib.FTP, data: bytes, remote: str, made: set[str]) -> None:
    if "/" in remote:
        ensure_dir(ftp, remote.rsplit("/", 1)[0], made)
    ftp.storbinary(f"STOR {remote}", io.BytesIO(data))


def remove_tree(ftp: ftplib.FTP, remote: str) -> None:
    try:
        ftp.delete(remote)
        return
    except ftplib.error_perm:
        pass
    try:
        names = [n for n in ftp.nlst(remote) if n.rsplit("/", 1)[-1] not in (".", "..")]
    except ftplib.error_perm:
        names = []
    for name in names:
        remove_tree(ftp, name if "/" in name else f"{remote}/{name}")
    try:
        ftp.rmd(remote)
    except ftplib.error_perm:
        pass


def php_str(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def production_config() -> bytes:
    """config.php. 세션 비밀값은 처음 한 번 만들어 secrets.txt 에 적어 둔다 (바뀌면 모든 회원 로그아웃)."""
    global S
    if not S.get("SESSION_SECRET"):
        with SECRETS_FILE.open("a", encoding="utf-8") as h:
            h.write(f"\n# 세션 서명값 (deploy.py 가 만듦, 바꾸면 전체 로그아웃)\nSESSION_SECRET={random.token_hex(32)}\n")
        S = load_secrets()
    g = lambda k, d="": S.get(k, d)  # noqa: E731
    oauth = "\n".join(f"        {php_str(p)} => ['client_id' => {php_str(g(p.upper() + '_CLIENT_ID'))}, 'client_secret' => {php_str(g(p.upper() + '_CLIENT_SECRET'))}]," for p in ("kakao", "naver", "google"))
    cost = g("AI_COST_PER_IMAGE_KRW")
    return (
        "<?php\n// deploy.py 가 secrets.txt 로 만든 실서버 설정 (서버에서 직접 고치지 않는다)\nreturn [\n"
        f"    'db_host' => {php_str(g('DB_HOST', 'localhost'))},\n    'db_port' => 3306,\n    'db_name' => {php_str(g('DB_NAME'))},\n"
        f"    'db_user' => {php_str(g('DB_USER'))},\n    'db_password' => {php_str(g('DB_PASSWORD'))},\n"
        f"    'session_secret' => {php_str(g('SESSION_SECRET'))},\n    'site_url' => {php_str(SITE)},\n    'dev' => false,\n"
        f"    'mail_from' => {php_str(g('MAIL_FROM', 'sales@terrywell.kr'))},\n    'notify_email' => {php_str(g('NOTIFY_EMAIL'))},\n"
        f"    'oauth' => [\n{oauth}\n    ],\n    'oauth_fake' => false,\n"
        f"    'ai_provider' => {php_str(g('AI_PROVIDER', 'mock'))},\n    'ai_images_per_request' => {int(g('AI_IMAGES_PER_REQUEST', '2'))},\n"
        f"    'ai_cost_per_image_krw' => {int(cost) if cost else 'null'},\n"
        f"    'openai_api_key' => {php_str(g('OPENAI_API_KEY'))},\n    'openai_image_model' => {php_str(g('OPENAI_IMAGE_MODEL', 'gpt-image-1.5'))},\n"
        f"    'google_api_key' => {php_str(g('GOOGLE_API_KEY'))},\n    'google_image_model' => {php_str(g('GOOGLE_IMAGE_MODEL', 'gemini-nano-banana-2.1'))},\n"
        f"    'portone_store_id' => {php_str(g('PORTONE_STORE_ID'))},\n    'portone_channel_key' => {php_str(g('PORTONE_CHANNEL_KEY'))},\n    'portone_api_secret' => {php_str(g('PORTONE_API_SECRET'))},\n"
        "];\n"
    ).encode("utf-8")


def php_files() -> list[Path]:
    root = ROOT / "php"
    return [p for p in root.rglob("*") if p.is_file() and p.name != "config.php" and not str(p.relative_to(root)).replace("\\", "/").startswith(("uploads/", "_storage/"))] + [root / "uploads" / ".htaccess", root / "_storage" / ".htaccess"]


def preflight() -> None:
    folder = f"_preflight_{random.token_hex(6)}"
    ftp = connect()
    made: set[str] = set()
    try:
        upload_bytes(ftp, b"Options -Indexes\nDirectorySlash Off\nDirectoryIndex index.html\n<IfModule mod_rewrite.c>\nRewriteEngine On\nRewriteCond %{ENV:REDIRECT_STATUS} ^$\nRewriteRule ^hidden\\.php$ - [F,L]\nRewriteCond %{REQUEST_FILENAME} -f\nRewriteRule ^ - [L]\nRewriteRule ^(.*)$ hidden.php?path=$1 [QSA,L]\n</IfModule>\n", f"{folder}/.htaccess", made)
        upload_bytes(ftp, b"<?php header('Content-Type: application/json'); echo json_encode(['path' => $_GET['path'] ?? null, 'php' => PHP_VERSION, 'pdo_mysql' => extension_loaded('pdo_mysql'), 'gd' => extension_loaded('gd'), 'curl' => extension_loaded('curl'), 'imagick' => extension_loaded('imagick'), 'mbstring' => extension_loaded('mbstring'), 'zlib' => extension_loaded('zlib'), 'upload_max' => ini_get('upload_max_filesize'), 'post_max' => ini_get('post_max_size'), 'memory' => ini_get('memory_limit'), 'exec' => ini_get('max_execution_time'), 'mail' => function_exists('mail'), 'proto' => $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? null, 'cf' => $_SERVER['HTTP_CF_VISITOR'] ?? null]);", f"{folder}/hidden.php", made)
        upload_bytes(ftp, b"static", f"{folder}/real.txt", made)
        ftp.mkd(f"{folder}/dir-route")
        base = f"{origin()}/{folder}"
        time.sleep(1)
        for label, url in {"정적 파일": f"{base}/real.txt", "없는 주소 → PHP 재작성": f"{base}/products/abc", "같은 이름 폴더가 있어도 리디렉트 없음": f"{base}/dir-route", "PHP 직접 접근 차단": f"{base}/hidden.php"}.items():
            status, body = http(url)
            print(f"  {label}: {status} {body[:400]}")
    finally:
        remove_tree(ftp, folder)
        ftp.quit()


def php() -> None:
    ftp = connect()
    made: set[str] = set()
    root = ROOT / "php"
    files = php_files()
    for path in files:
        upload(ftp, path, path.relative_to(root).as_posix(), made)
    ftp.quit()
    print(f"  PHP {len(files)}개 업로드")


def config() -> None:
    ftp = connect()
    upload_bytes(ftp, production_config(), "api/config.php", set())
    ftp.quit()
    print("  config.php 업로드")


def backend() -> None:
    ftp = connect()
    made: set[str] = set()
    root = ROOT / "php"
    files = php_files()
    for path in files:
        upload(ftp, path, path.relative_to(root).as_posix(), made)
    upload_bytes(ftp, production_config(), "api/config.php", made)
    print(f"  PHP {len(files)}개 + config.php 업로드")

    subprocess.run([str(PHP), str(CAFE24 / "make_data_sql.php")], cwd=ROOT, check=True)
    subprocess.run([str(PHP), "-r", 'require "php/api/_lib/core.php"; require "php/api/_lib/tables.php"; file_put_contents("cafe24/schema.sql", schema_sql());'], cwd=ROOT, check=True)
    folder = f"_install_{random.token_hex(8)}"
    try:
        for name, local in (("install.php", CAFE24 / "install.php"), ("schema.sql", CAFE24 / "schema.sql"), ("data.sql", CAFE24 / "build" / "data.sql")):
            upload(ftp, local, f"{folder}/{name}", made)
        base = f"{origin()}/{folder}/install.php"
        status, body = http(f"{base}?step=check")
        print("  확인:", status, body[:1500])
        report = json.loads(body)
        if not report.get("ok"):
            raise SystemExit("DB 접속 실패 — secrets.txt 의 DB 정보를 확인해주세요.")
        admin = urllib.parse.urlencode({"admin_email": S.get("ADMIN_EMAIL", ""), "admin_password": S.get("ADMIN_PASSWORD", "")}).encode()
        status, body = http(f"{base}?step=install", admin)
        print("  설치:", status, body[:1500])
    finally:
        remove_tree(ftp, folder)
        ftp.quit()


def site() -> None:
    base = origin()
    status, body = http(f"{base}/api/health")
    if status != 200:
        raise SystemExit(f"실서버 API 가 응답하지 않아요 ({status} {body[:200]}). backend 단계를 먼저 실행해주세요.")
    subprocess.run([sys.executable, str(CAFE24 / "build.py"), "--site-url", SITE], check=True)

    local_files = {p.relative_to(WWW).as_posix(): p for p in WWW.rglob("*") if p.is_file()}
    keep = lambda rel: (rel.startswith(("uploads/", "_storage/")) and not rel.endswith(".htaccess")) or rel == "api/config.php"  # noqa: E731
    targets = {rel: path for rel, path in local_files.items() if not keep(rel)}
    previous = set(json.loads(MANIFEST.read_text(encoding="utf-8"))) if MANIFEST.exists() else set()

    ftp = connect()
    made: set[str] = set()
    order = sorted(targets, key=lambda rel: (not rel.startswith("_next/"), rel))
    for index, rel in enumerate(order, 1):
        upload(ftp, targets[rel], rel, made)
        if index % 50 == 0:
            print(f"  {index}/{len(order)}")
    stale = sorted(previous - set(targets))
    for rel in stale:
        try:
            ftp.delete(rel)
        except ftplib.error_perm:
            pass
    ftp.quit()
    MANIFEST.write_text(json.dumps(sorted(targets), ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"  업로드 {len(order)}개, 지난 배포 파일 정리 {len(stale)}개 → {SITE}")


def check() -> None:
    base = origin()
    for path in ("/api/health", "/", "/products/lollipop-stripe-towel", "/login", "/api/public/snapshot"):
        status, body = http(f"{base}{path}")
        print(f"  {status} {path} {len(body)}B {body[:120].replace(chr(10), ' ')}")


if __name__ == "__main__":
    steps = {"preflight": preflight, "backend": backend, "php": php, "config": config, "site": site, "check": check}
    if len(sys.argv) < 2 or sys.argv[1] not in steps:
        raise SystemExit(__doc__)
    steps[sys.argv[1]]()
