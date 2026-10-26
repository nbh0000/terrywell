import Link from "next/link";
import type { ReactNode } from "react";

// 관리자 화면 공통 요소 (서버·클라이언트 양쪽에서 쓴다)

export const inputCls = "h-10 w-full rounded-[6px] border border-line bg-white px-3 text-[14px] outline-none focus:border-ink/50";
export const textareaCls = "w-full rounded-[6px] border border-line bg-white p-3 text-[14px] outline-none focus:border-ink/50";
export const btnCls = "inline-flex h-10 items-center justify-center rounded-[6px] bg-ink px-4 text-[14px] text-white hover:bg-ink/85 disabled:opacity-50";
export const btnLineCls = "inline-flex h-10 items-center justify-center rounded-[6px] border border-line bg-white px-4 text-[14px] hover:border-ink/40 disabled:opacity-50";

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-[22px] font-semibold">{title}</h1>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[10px] border border-line bg-white p-5 ${className}`}>
      {title && <h2 className="mb-4 text-[15px] font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function Label({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block text-[13px]">
      <span className="mb-1 block text-ink/70">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-line bg-white">
      <table className="w-full min-w-[640px] text-[13.5px]">
        <thead>
          <tr className="border-b border-line bg-cloud/60 text-left text-ink/70">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-2.5 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-[10px] border border-dashed border-line bg-white py-14 text-center text-[14px] text-muted">{children}</p>;
}

export function Pager({ page, pages, base }: { page: number; pages: number; base: string }) {
  if (pages <= 1) return null;
  const sep = base.includes("?") ? "&" : "?";
  return (
    <nav className="mt-4 flex gap-1">
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Link key={n} href={`${base}${sep}page=${n}`} className={`grid size-8 place-items-center rounded-[6px] text-[13px] ${n === page ? "bg-ink text-white" : "bg-white text-muted"}`}>
          {n}
        </Link>
      ))}
    </nav>
  );
}

export const dt = (iso: string) => new Date(iso).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
