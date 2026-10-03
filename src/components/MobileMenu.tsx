"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { logoutAction } from "@/app/(site)/(auth)/actions";

export function MobileMenu({
  nav,
  loggedIn,
  isAdmin,
}: {
  nav: { href: string; label: string }[];
  loggedIn: boolean;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  // 연 페이지 경로를 기억해서, 다른 페이지로 이동하면 자동으로 닫힌다
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const setOpen = (v: boolean) => setOpenedAt(v ? pathname : null);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // 헤더의 backdrop-blur 가 fixed 요소를 가두므로 패널은 body 로 꺼내 그린다
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const sub = [
    { href: "/search", label: "검색" },
    { href: "/mypage/wishlist", label: "찜" },
    { href: loggedIn ? "/mypage" : "/login", label: loggedIn ? "마이페이지" : "로그인/회원가입" },
    { href: "/guide", label: "이용가이드" },
    ...(isAdmin ? [{ href: "/admin", label: "관리자" }] : []),
  ];

  return (
    <>
      <button type="button" aria-label="메뉴 열기" aria-expanded={open} onClick={() => setOpen(true)} className="p-1 text-ink/80">
        <Menu size={22} strokeWidth={1.5} />
      </button>
      {mounted && createPortal(<>
      <div
        className={`fixed inset-0 z-50 bg-black/30 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-[340px] flex-col bg-paper px-6 pb-8 pt-5 transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
        aria-hidden={!open}
      >
        <button type="button" aria-label="메뉴 닫기" onClick={() => setOpen(false)} className="-ml-1 self-start p-1 text-ink/70">
          <X size={22} strokeWidth={1.5} />
        </button>
        <nav className="mt-8 flex flex-col">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="border-b border-line py-4 text-lg">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 flex flex-col gap-3 text-sm text-muted">
          {sub.map((s) => (
            <Link key={s.href} href={s.href}>{s.label}</Link>
          ))}
          {loggedIn && (
            <form action={logoutAction}>
              <button type="submit">로그아웃</button>
            </form>
          )}
        </div>
      </aside>
      </>, document.body)}
    </>
  );
}
