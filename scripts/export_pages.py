"""
GitHub Pages 미리보기판 만들기.

서버(next start, basePath=/terrywell)가 떠 있는 상태에서 공개 페이지를 받아 정적 HTML 로 저장한다.
로그인·장바구니·결제·디자인 저장·AI 생성처럼 서버가 필요한 기능은 미리보기판에서 동작하지 않는다.

사용:
  NEXT_BASE_PATH=/terrywell NEXT_DIST_DIR=.next-pages npx next build
  NEXT_BASE_PATH=/terrywell NEXT_DIST_DIR=.next-pages npx next start -p 3200
  python scripts/export_pages.py
"""
import json
import os
import re
import shutil
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "/terrywell"
ORIGIN = "http://localhost:3200"
OUT = os.path.join(ROOT, ".pages-out")
DIST = os.path.join(ROOT, ".next-pages")

db = json.load(open(os.path.join(ROOT, ".data", "db.json"), encoding="utf-8"))
products = [p for p in db["products"] if p["is_visible"]]
pages = ["/", "/about", "/custom-label", "/products", "/quote", "/notices", "/guide", "/terms", "/privacy", "/login", "/signup", "/search"]
pages += [f"/products/{p['slug']}" for p in products]
pages += [f"/editor/{p['slug']}" for p in products if p["allow_editor"]]
pages += [f"/notices/{n['id']}" for n in db["notices"]]

# 미리보기판 안내 띠
NOTICE = (
    '<div style="position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#241a18;color:#fff;'
    'font:13px/1.5 sans-serif;text-align:center;padding:8px 12px">'
    "미리보기판입니다 · 로그인, 장바구니, 결제, 디자인 저장, AI 생성은 실제 서버에서만 동작합니다</div>"
)


def rewrite(text: str) -> str:
    # basePath 가 자동으로 붙지 않는 정적 파일 경로 (데이터에 들어 있는 /images 등)
    for prefix in ("/images/", "/stickers/", "/api/files/"):
        text = re.sub(r'(?<![\w/])' + re.escape(prefix), BASE + prefix, text)
    return text


shutil.rmtree(OUT, ignore_errors=True)
os.makedirs(OUT)
for path in pages:
    with urllib.request.urlopen(ORIGIN + BASE + (path if path != "/" else "")) as r:
        html = r.read().decode("utf-8")
    html = rewrite(html)
    if not path.startswith("/editor/"):  # 에디터는 하단 툴바를 가리지 않게 안내 띠를 뺀다
        html = html.replace("</body>", NOTICE + "</body>")
    target = os.path.join(OUT, path.strip("/"), "index.html") if path != "/" else os.path.join(OUT, "index.html")
    os.makedirs(os.path.dirname(target), exist_ok=True)
    open(target, "w", encoding="utf-8").write(html)
    print("saved", path)

# 404 페이지 (Pages 가 없는 주소에 보여 준다)
try:
    urllib.request.urlopen(ORIGIN + BASE + "/__not_found__")
except urllib.error.HTTPError as e:
    open(os.path.join(OUT, "404.html"), "w", encoding="utf-8").write(rewrite(e.read().decode("utf-8")))

# 정적 자산: _next/static, public
shutil.copytree(os.path.join(DIST, "static"), os.path.join(OUT, "_next", "static"))
for name in os.listdir(os.path.join(ROOT, "public")):
    src = os.path.join(ROOT, "public", name)
    dst = os.path.join(OUT, name)
    (shutil.copytree if os.path.isdir(src) else shutil.copy2)(src, dst)
open(os.path.join(OUT, ".nojekyll"), "w").close()  # _next 폴더를 Pages 가 무시하지 않게
print("done:", OUT)
