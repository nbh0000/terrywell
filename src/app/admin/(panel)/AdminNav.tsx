"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const MENU = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/products", label: "제품 관리" },
  { href: "/admin/templates", label: "템플릿" },
  { href: "/admin/stickers", label: "스티커" },
  { href: "/admin/fonts", label: "글꼴" },
  { href: "/admin/orders", label: "주문 관리" },
  { href: "/admin/inquiries", label: "1:1 문의" },
  { href: "/admin/quotes", label: "견적문의" },
  { href: "/admin/faqs", label: "자주 묻는 질문" },
  { href: "/admin/notices", label: "공지사항" },
  { href: "/admin/members", label: "회원 관리" },
  { href: "/admin/ai", label: "AI 설정" },
  { href: "/admin/site", label: "사이트 설정" },
];

export const isActive = (path: string, href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="관리자 메뉴" className="flex flex-col gap-0.5">
      {MENU.map((m) => (
        <Link key={m.href} href={m.href} onClick={onNavigate} aria-current={isActive(path, m.href) ? "page" : undefined} className={`rounded-[6px] px-3 py-2.5 text-[14px] ${isActive(path, m.href) ? "bg-ink text-white" : "text-ink/80 hover:bg-cloud"}`}>
          {m.label}
        </Link>
      ))}
    </nav>
  );
}
