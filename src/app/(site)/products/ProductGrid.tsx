"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { NewBadge } from "@/components/shop/NewBadge";

export interface GridProduct {
  id: string;
  slug: string;
  nameEn: string;
  nameKo: string;
  image: { url: string | null; alt: string } | null;
  price: number;
  categories: string[];
  isNew: boolean;
}

const won = (n: number) => n.toLocaleString("ko-KR") + "원";

// 탭·검색은 화면에서 바로 거른다 (주소에도 남겨 공유·새로고침 시 유지)
export function ProductGrid({ products, tabs, initialTab, initialQ }: { products: GridProduct[]; tabs: { slug: string; name: string }[]; initialTab: string; initialQ: string }) {
  const [tab, setTab] = useState(initialTab);
  const [q, setQ] = useState(initialQ);

  // 정적 미리보기처럼 서버가 주소를 못 읽는 경우를 위해 마운트 후 한 번 더 읽는다
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const t = sp.get("tab");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버가 주소를 못 읽는 정적 미리보기에서만 바뀐다
    if (t && t !== tab && tabs.some((x) => x.slug === t)) setTab(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(t: string) {
    setTab(t);
    const url = new URL(location.href);
    if (t === "all") url.searchParams.delete("tab");
    else url.searchParams.set("tab", t);
    history.replaceState(null, "", url);
  }

  const query = q.trim().toLowerCase();
  const list = products.filter(
    (p) =>
      (tab === "all" || (tab === "new" ? p.isNew : p.categories.includes(tab))) &&
      (!query || `${p.nameEn} ${p.nameKo}`.toLowerCase().includes(query)),
  );
  const current = tabs.find((t) => t.slug === tab);

  return (
    <>
      <nav className="flex border-b border-ink/25 font-display text-[15px] font-medium md:text-[17px]">
        {tabs.map((t) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => pick(t.slug)}
            aria-pressed={tab === t.slug}
            className={`w-1/4 pb-2.5 text-left md:w-[13%] ${tab === t.slug ? "text-point" : "text-ink hover:text-point"}`}
          >
            {t.name}
          </button>
        ))}
      </nav>
      <form
        onSubmit={(e) => e.preventDefault()}
        role="search"
        className="flex items-center gap-2 border-b border-ink/45 py-2.5"
      >
        <Search size={16} strokeWidth={1.6} className="text-ink/70" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제품명 검색"
          aria-label="제품명 검색"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-ink/45"
        />
      </form>

      <h1 className="mt-12 font-display text-[17px] font-medium text-ink md:mt-16 md:text-[19px]">
        {current && current.slug !== "all" ? current.name : "Products"}
      </h1>
      {list.length === 0 ? (
        <p className="py-24 text-center text-sm text-muted">
          {query ? `"${q.trim()}" 검색 결과가 없습니다.` : tab === "new" ? "새로 나온 제품이 없습니다." : "등록된 제품이 없습니다."}
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-[1.9%] md:gap-y-16">
          {list.map((p) => (
            <li key={p.id}>
              <Link href={`/products/${p.slug}`} className="group block">
                <div className="relative aspect-square overflow-hidden bg-tile">
                  {p.image?.url && (
                    // 흰 바탕 사진도 회색 칸에 자연스럽게 섞이도록 multiply
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image.url} alt={p.image.alt} className="h-full w-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.03]" />
                  )}
                  {p.isNew && <NewBadge className="absolute left-3 top-3 md:left-4 md:top-4" />}
                </div>
                <div className="mt-2 font-display text-[15px] font-medium leading-snug text-ink md:text-[17px]">{p.nameEn}</div>
                <div className="text-[14px] leading-snug text-ink md:text-[15px]">{p.nameKo}</div>
                <div className="mt-1 text-[14px] text-muted">{won(p.price)}~</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
