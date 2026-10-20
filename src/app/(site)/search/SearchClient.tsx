"use client";

import { useEffect } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@/lib/page";

// 헤더 검색 아이콘: 제품명 검색 (결과는 제품 소개 목록에서 보여 준다)
export function SearchClient() {
  const q = useQuery();
  useEffect(() => {
    const term = q?.get("q")?.trim();
    if (term) window.location.replace(`/products?q=${encodeURIComponent(term)}`);
  }, [q]);
  return (
    <section className="mx-auto w-full max-w-[640px] px-5 py-24">
      <form action="/search" className="flex items-center gap-3 border-b-2 border-ink pb-3">
        <Search size={22} strokeWidth={1.6} />
        <input name="q" autoFocus placeholder="제품명을 입력하세요" aria-label="제품명 검색" className="w-full bg-transparent text-[18px] outline-none placeholder:text-ink/40" />
      </form>
    </section>
  );
}
