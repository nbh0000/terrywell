"""정적 빌드(www, Apache 8091) 화면 전수 확인. 콘솔 오류·실패한 요청·화면 글자를 모은다.
  python cafe24/verify/smoke.py [base_url]
"""

import io
import json
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

from playwright.sync_api import sync_playwright

BASE = next((a for a in sys.argv[1:] if not a.startswith("--")), "http://localhost:8091")
PAGES = [
    "/", "/about", "/custom-label", "/products", "/products/lollipop-stripe-towel", "/products/nope",
    "/qna", "/qna/inquiry", "/quote", "/notices", "/guide", "/terms", "/privacy", "/login", "/signup", "/order-lookup", "/search",
    "/editor/lollipop-stripe-towel", "/cart", "/mypage",
]
ADMIN = ["/admin", "/admin/products", "/admin/products/new", "/admin/orders", "/admin/quotes", "/admin/inquiries", "/admin/notices", "/admin/faqs", "/admin/templates", "/admin/stickers", "/admin/fonts", "/admin/site", "/admin/ai", "/admin/members"]


def main() -> None:
    report = []
    with sync_playwright() as p:
        import re as _re
        args = []
        live = "--live" in sys.argv
        if live:
            sec = dict(l.split("=", 1) for l in io.open("C:/Users/pc/terrywell/cafe24/secrets.txt", encoding="utf-8").read().splitlines() if "=" in l and not l.startswith("#"))
            host = _re.sub(r"^https?://", "", BASE).split("/")[0]
            args.append(f"--host-resolver-rules=MAP {host} {sec['FTP_IP']}")
        browser = p.chromium.launch(args=args)
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        errors: list[str] = []
        bad: list[str] = []
        page.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type in ("error",) else None)
        page.on("response", lambda r: bad.append(f"{r.status} {r.url}") if r.status >= 400 else None)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

        def visit(path: str, wait: str | None = None) -> str:
            errors.clear()
            bad.clear()
            try:
                page.goto(BASE + path, wait_until="networkidle", timeout=30000)
            except Exception as e:  # noqa: BLE001
                page.wait_for_timeout(1500)
                errors.append(f"goto: {str(e)[:120]}")
            if wait:
                try:
                    page.wait_for_selector(wait, timeout=8000)
                except Exception:  # noqa: BLE001
                    pass
            page.wait_for_timeout(600)
            text = page.inner_text("body")[:400].replace("\n", " | ")
            report.append({"path": path, "url": page.url, "errors": list(errors), "bad": list(bad), "text": text})
            print(f"[{'!!' if errors or bad else 'ok'}] {path} -> {page.url}", flush=True)
            print("    ", text[:150], flush=True)
            for e in errors[:4]: print("     ERR", e[:220], flush=True)
            for b in bad[:4]: print("     BAD", b[:220], flush=True)
            return text

        for path in ([] if "--admin-only" in sys.argv else (PAGES[:6] + ["/login", "/editor/lollipop-stripe-towel"] if live else PAGES)):
            visit(path)
        if "--admin-only" in sys.argv:
            PAGES.clear()

        # 로그인 (로컬 테스트 회원)
        if "--admin-only" in sys.argv or live:
            admin_part(page, visit, report)
            browser.close()
            return
        page.goto(BASE + "/login?next=/mypage", wait_until="networkidle")
        page.fill('input[name="email"]', "t1@example.com")
        page.fill('input[name="password"]', "password1")
        page.click('main form button[type="submit"]')
        page.wait_for_function("() => location.pathname === '/mypage'", timeout=20000)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1200)
        report.append({"path": "login→/mypage", "url": page.url, "text": page.inner_text("body")[:300].replace("\n", " | "), "errors": [], "bad": []})

        # 클라이언트 이동: 홈 → 제품 (Link) → 에디터
        visit("/")
        before = len(bad)
        page.click('a[href^="/products/lollipop-stripe-towel"]')
        page.wait_for_timeout(2500)
        report.append({"path": "client nav home→product", "url": page.url, "text": page.inner_text("body")[:300].replace("\n", " | "), "errors": list(errors), "bad": list(bad)[before:]})
        for path in ["/cart", "/mypage/designs", "/mypage/profile", "/qna/inquiry", "/qna/inquiry/new", "/checkout?items=", "/editor/lollipop-stripe-towel"]:
            visit(path)

        # 관리자 로그인
        admin_part(page, visit, report)
        browser.close()
    for r in report:
        flag = "!!" if r["errors"] or r["bad"] else "ok"
        print(f"[{flag}] {r['path']} → {r['url']}")
        print("    ", r["text"][:160])
        for e in r["errors"][:5]:
            print("     ERR", e[:200])
        for b in r["bad"][:5]:
            print("     BAD", b[:200])
    json.dump(report, open("C:/Users/pc/terrywell/cafe24/build/smoke-report.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def admin_part(page, visit, report):
    # 먼저 로그아웃 (헤더의 로그아웃 버튼) 뒤 관리자 로그인
    page.goto(BASE + "/", wait_until="networkidle")
    try:
        page.click('header form button[type="submit"]', timeout=5000)
        page.wait_for_timeout(1500)
    except Exception:  # noqa: BLE001
        pass
    page.goto(BASE + "/admin/login", wait_until="networkidle")
    import re, io
    if "--live" in sys.argv:
        sec = dict(l.split("=", 1) for l in io.open("C:/Users/pc/terrywell/cafe24/secrets.txt", encoding="utf-8").read().splitlines() if "=" in l and not l.startswith("#"))
        email, pw = sec["ADMIN_EMAIL"], sec["ADMIN_PASSWORD"]
    else:
        login = io.open("C:/Users/pc/terrywell/.data/admin-login.txt", encoding="utf-8").read()
        email = re.search(r"email:\s*(\S+)", login).group(1)
        pw = re.search(r"password:\s*(\S+)", login).group(1)
    page.fill('input[name="email"]', email)
    page.fill('input[name="password"]', pw)
    page.click('main form button[type="submit"]')
    page.wait_for_function("() => location.pathname === '/admin'", timeout=20000)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    for path in ADMIN:
        visit(path)


if __name__ == "__main__":
    main()
