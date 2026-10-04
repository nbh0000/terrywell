import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";

export const metadata: Metadata = { title: "검색" };

// 헤더 검색 아이콘: 제품명 검색 (결과는 제품 소개 목록에서 보여 준다)
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  if (typeof sp.q === "string" && sp.q.trim()) redirect(`/products?q=${encodeURIComponent(sp.q.trim())}`);
  return (
    <section className="mx-auto w-full max-w-[640px] px-5 py-24">
      <form action="/search" className="flex items-center gap-3 border-b-2 border-ink pb-3">
        <Search size={22} strokeWidth={1.6} />
        <input name="q" autoFocus placeholder="제품명을 입력하세요" aria-label="제품명 검색" className="w-full bg-transparent text-[18px] outline-none placeholder:text-ink/40" />
      </form>
    </section>
  );
}
