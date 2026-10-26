"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ExternalLink, LogOut, Menu } from "lucide-react";
import { requireAdmin, signOut } from "@/lib/auth";
import { Loading, usePageData } from "@/lib/page";
import { AdminNav, MENU, isActive } from "./AdminNav";

// 관리자 화면 틀 (쇼핑몰 화면과 분리). 관리자가 아니면 /admin/login 으로 보낸다 (데이터 권한은 서버가 따로 막는다)
export function AdminShell({ children }: { children: ReactNode }) {
  const { data: admin } = usePageData(() => requireAdmin());
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const current = [...MENU].reverse().find((m) => isActive(path, m.href));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function logout() {
    await signOut();
    window.location.assign("/admin/login");
  }

  if (!admin) return <Loading className="min-h-screen" />;
  return (
    <div className="min-h-screen flex-1 bg-[#f3f3f1]">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-line bg-white transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <Link href="/admin" onClick={() => setOpen(false)} className="flex h-16 shrink-0 items-center gap-2 border-b border-line px-5">
          <span className="font-serif text-[17px] font-extrabold text-point">TERRYWELL</span>
          <span className="text-[12px] text-muted">관리자</span>
        </Link>
        <div className="flex-1 overflow-y-auto p-3">
          <AdminNav onNavigate={() => setOpen(false)} />
          <a href="/" target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-2 border-t border-line px-3 pt-4 text-[14px] text-ink/70 hover:text-ink">
            <ExternalLink size={15} strokeWidth={1.6} />사이트 보기
          </a>
        </div>
        <div className="border-t border-line p-3">
          <p className="truncate px-3 pb-2 text-[12px] text-muted">{admin.name || admin.email}</p>
          <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-[6px] px-3 py-2.5 text-left text-[14px] text-ink/80 hover:bg-cloud">
            <LogOut size={15} strokeWidth={1.6} />로그아웃
          </button>
        </div>
      </aside>
      {open && <button type="button" aria-label="메뉴 닫기" className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex min-h-screen flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white px-4 md:px-8">
          <button type="button" aria-label="메뉴 열기" onClick={() => setOpen(true)} className="-ml-1 p-1 text-ink/80 lg:hidden">
            <Menu size={22} strokeWidth={1.5} />
          </button>
          <p className="text-[15px] font-medium">{current?.label ?? "관리자"}</p>
        </header>
        <main className="min-w-0 flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
