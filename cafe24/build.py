"""카페24(PHP 호스팅)에 올릴 파일을 cafe24/build/www 에 만든다.

1) Next.js 정적 빌드 (output: export)  → out/
2) out/ + php/ (API, .htaccess, _page.php) 를 www/ 로 모은다

실행 예:
  로컬 확인용:  python cafe24/build.py                      (site_url http://localhost:8091, config.php 포함)
  실서버용:     python cafe24/build.py --site-url https://terrywell.kr
로컬 확인은 Apache(8091, DOCROOT=cafe24/build/www)+MariaDB(3309) 가 켜져 있어야 한다.
"""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WWW = ROOT / "cafe24" / "build" / "www"
NPX = "npx.cmd" if os.name == "nt" else "npx"
KEEP = {"uploads", "_storage"}  # 서버에서 쌓이는 파일. 로컬 www 에서도 지우지 않는다


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site-url", default="http://localhost:8091")
    parser.add_argument("--skip-build", action="store_true", help="out/ 이 이미 있으면 Next 빌드를 건너뛴다")
    args = parser.parse_args()
    local = args.site_url.startswith("http://localhost")

    if not args.skip_build:
        print("1/2 정적 빌드")
        env = {**os.environ, "TW_EXPORT": "1", "NEXT_PUBLIC_SITE_URL": args.site_url, "NODE_ENV": "production"}
        shutil.rmtree(ROOT / "out", ignore_errors=True)
        subprocess.run([NPX, "next", "build"], cwd=ROOT, env=env, check=True)

    print("2/2 파일 모으기")
    WWW.mkdir(parents=True, exist_ok=True)
    for item in WWW.iterdir():
        if item.name in KEEP:
            continue
        shutil.rmtree(item) if item.is_dir() else item.unlink()
    shutil.copytree(ROOT / "out", WWW, dirs_exist_ok=True)
    shutil.copytree(ROOT / "php", WWW, dirs_exist_ok=True, ignore=shutil.ignore_patterns("config.php", "uploads", "_storage"))
    if local:
        shutil.copy2(ROOT / "php" / "api" / "config.php", WWW / "api" / "config.php")
        # 로컬 확인용 www 는 API 개발용 php/ 폴더의 저장 파일을 그대로 본다
        for d in KEEP:
            src = ROOT / "php" / d
            if src.exists():
                shutil.copytree(src, WWW / d, dirs_exist_ok=True)
    for d in KEEP:
        (WWW / d).mkdir(exist_ok=True)
    shutil.copy2(ROOT / "php" / "uploads" / ".htaccess", WWW / "uploads" / ".htaccess")
    shutil.copy2(ROOT / "php" / "_storage" / ".htaccess", WWW / "_storage" / ".htaccess")
    html = sum(1 for p in WWW.rglob("*.html"))
    print(f"  완료: {WWW} (HTML {html}개)")


if __name__ == "__main__":
    main()
