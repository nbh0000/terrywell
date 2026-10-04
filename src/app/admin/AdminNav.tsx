"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/products", label: "제품 관리" },
  { href: "/admin/templates", label: "템플릿" },
  { href: "/admin/stickers", label: "스티커" },
  { href: "/admin/orders", label: "주문 관리" },
  { href: "/admin/quotes", label: "견적문의" },
  { href: "/admin/notices", label: "공지사항" },
  { href: "/admin/members", label: "회원 관리" },
  { href: "/admin/ai", label: "AI 설정" },
  { href: "/admin/site", label: "사이트 설정" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-white p-2 [scrollbar-width:none] lg:w-52 lg:flex-col lg:border-b-0 lg:border-r lg:p-3">
      {MENU.map((m) => {
        const active = m.href === "/admin" ? path === "/admin" : path.startsWith(m.href);
        return (
          <Link key={m.href} href={m.href} className={`shrink-0 rounded-[6px] px-3 py-2 text-[14px] ${active ? "bg-ink text-white" : "text-ink/80 hover:bg-cloud"}`}>
            {m.label}
          </Link>
        );
      })}
    </nav>
  );
}
