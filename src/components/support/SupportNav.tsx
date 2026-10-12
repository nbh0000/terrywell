"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, ClipboardList, Megaphone, MessagesSquare } from "lucide-react";

const MENU = [
  { href: "/qna", label: "자주 묻는 질문", Icon: CircleHelp, exact: true },
  { href: "/qna/inquiry", label: "1:1 문의", Icon: MessagesSquare },
  { href: "/quote", label: "견적 문의", Icon: ClipboardList },
  { href: "/notices", label: "공지사항", Icon: Megaphone },
];

export function SupportNav() {
  const path = usePathname();
  return (
    <nav className="mt-2 flex gap-1 overflow-x-auto [scrollbar-width:none] md:mt-4 md:flex-col md:gap-0.5">
      {MENU.map(({ href, label, Icon, exact }) => {
        const active = exact ? path === href : path === href || path.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-[14.5px] transition-colors ${active ? "font-medium text-point" : "text-ink/70 hover:text-ink"}`}
          >
            <Icon size={18} strokeWidth={1.6} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
