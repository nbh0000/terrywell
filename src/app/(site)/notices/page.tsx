import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "공지사항" };

const PER_PAGE = 10;

export default async function NoticesPage({ searchParams }: PageProps<"/notices">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const all = await getDb().select("notices", { order: [{ column: "created_at", ascending: false }] });
  const sorted = [...all.filter((n) => n.is_pinned), ...all.filter((n) => !n.is_pinned)];
  const pages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const list = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <section className="mx-auto w-full max-w-[960px] px-5 pb-24 pt-12 md:px-10 md:pt-16">
      <h1 className="font-display text-[22px] font-medium">Notice</h1>
      <p className="text-[14px] text-muted">공지사항</p>
      <ul className="mt-8 border-t border-ink/70">
        {list.length === 0 && <li className="py-16 text-center text-[14px] text-muted">등록된 공지사항이 없습니다.</li>}
        {list.map((n, i) => (
          <li key={n.id} className="border-b border-line">
            <Link href={`/notices/${n.id}`} className="flex items-center gap-4 px-1 py-4 hover:bg-paper/60">
              <span className="w-10 shrink-0 text-center text-[13px] text-muted">{n.is_pinned ? <span className="rounded-[3px] bg-ink px-1.5 py-0.5 text-[11px] text-white">공지</span> : sorted.length - ((page - 1) * PER_PAGE + i)}</span>
              <span className="min-w-0 flex-1 truncate text-[15px]">{n.title}</span>
              <span className="shrink-0 text-[13px] text-muted">{new Date(n.created_at).toLocaleDateString("ko-KR")}</span>
            </Link>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <nav className="mt-8 flex justify-center gap-1" aria-label="페이지">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={`/notices?page=${n}`} aria-current={n === page ? "page" : undefined} className={`grid size-9 place-items-center text-[14px] ${n === page ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
              {n}
            </Link>
          ))}
        </nav>
      )}
    </section>
  );
}
