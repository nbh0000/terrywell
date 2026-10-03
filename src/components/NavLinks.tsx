"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 시안처럼 지금 있는 메뉴는 옅은 회색으로 표시
export function NavLinks({ nav }: { nav: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="ml-12 flex gap-9 text-[16px] tracking-[0.04em]">
      {nav.map((n) => {
        const active = pathname === n.href || pathname.startsWith(n.href + "/");
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={active ? "text-ink/35" : "text-ink transition-colors hover:text-point"}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
