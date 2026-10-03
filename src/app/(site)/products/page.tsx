import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "제품 소개" };

const won = (n: number) => n.toLocaleString("ko-KR") + "원";

// reference/01 "제품 소개 페이지" 시안: 탭(BEST·ALL·NEW·TOWEL), 검색, Products 3열 그리드
export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const sp = await searchParams;
  const tab = typeof sp.tab === "string" ? sp.tab : "all";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const db = getDb();
  const categories = await db.select("categories", { order: [{ column: "sort_order" }] });
  let products = await db.select("products", { where: { is_visible: true }, order: [{ column: "sort_order" }] });
  if (tab !== "all") products = products.filter((p) => p.category_slugs.includes(tab));
  if (q) products = products.filter((p) => `${p.name_en} ${p.name_ko}`.toLowerCase().includes(q.toLowerCase()));

  // 시안 순서: BEST · ALL · NEW · TOWEL
  const tabs = [
    ...categories.slice(0, 1).map((c) => ({ slug: c.slug, name: c.name })),
    { slug: "all", name: "ALL" },
    ...categories.slice(1).map((c) => ({ slug: c.slug, name: c.name })),
  ];

  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-24 pt-12 md:px-10 md:pt-[5%]">
      <nav className="flex gap-0 border-b border-ink/25 font-display text-[15px] font-medium md:text-[17px]">
        {tabs.map((t) => (
          <Link
            key={t.slug}
            href={t.slug === "all" ? "/products" : `/products?tab=${t.slug}`}
            className={`w-1/4 pb-2.5 md:w-[13%] ${tab === t.slug ? "text-point" : "text-ink hover:text-point"}`}
          >
            {t.name}
          </Link>
        ))}
      </nav>
      <form action="/products" className="flex items-center gap-2 border-b border-ink/45 py-2.5">
        {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
        <Search size={16} strokeWidth={1.6} className="text-ink/70" />
        <input
          name="q"
          defaultValue={q}
          placeholder="제품명 검색"
          aria-label="제품명 검색"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-ink/45"
        />
      </form>

      <h1 className="mt-12 font-display text-[17px] font-medium text-ink md:mt-16 md:text-[19px]">Products</h1>
      {products.length === 0 ? (
        <p className="py-24 text-center text-sm text-muted">{q ? `"${q}" 검색 결과가 없습니다.` : "등록된 제품이 없습니다."}</p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-[1.9%] md:gap-y-16">
          {products.map((p) => (
            <li key={p.id}>
              <Link href={`/products/${p.slug}`} className="group block">
                <div className="aspect-square overflow-hidden bg-paper">
                  {p.images[0]?.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0].url} alt={p.images[0].alt} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                  )}
                </div>
                <div className="mt-2 font-display text-[15px] font-medium leading-snug text-ink md:text-[17px]">{p.name_en}</div>
                <div className="text-[14px] leading-snug text-ink md:text-[15px]">{p.name_ko}</div>
                <div className="mt-1 text-[14px] text-muted">{won(p.base_price)}~</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
