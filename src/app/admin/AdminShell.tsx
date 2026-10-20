"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";
import { Loading, usePageData } from "@/lib/page";
import { AdminNav } from "./AdminNav";

// 관리자 화면 틀. 관리자가 아니면 로그인/처음 화면으로 보낸다 (데이터 권한은 서버가 따로 막는다)
export function AdminShell({ children }: { children: ReactNode }) {
  const { data: admin } = usePageData(() => requireAdmin());
  if (!admin) return <Loading className="min-h-screen" />;
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f3f3f1]">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-line bg-white px-5">
        <Link href="/admin" className="font-serif text-[17px] font-extrabold text-point">TERRYWELL</Link>
        <span className="text-[13px] text-muted">관리자</span>
        <span className="ml-auto text-[13px] text-muted">{admin.name || admin.email}</span>
        <Link href="/" className="text-[13px] text-muted underline">사이트로</Link>
      </header>
      <div className="flex flex-1 flex-col lg:flex-row">
        <AdminNav />
        <main className="min-w-0 flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
