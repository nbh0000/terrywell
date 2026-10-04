"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/mypage", label: "주문 내역" },
  { href: "/mypage/designs", label: "저장한 디자인" },
  { href: "/mypage/wishlist", label: "찜 목록" },
  { href: "/mypage/profile", label: "회원정보" },
];

export function MyNav() {
  const path = usePathname();
  return (
    <nav className="mt-8 flex overflow-x-auto border-b border-line [scrollbar-width:none]">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`shrink-0 px-4 pb-3 text-[15px] ${path === t.href ? "border-b-2 border-ink font-medium text-ink" : "text-muted hover:text-ink"}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
