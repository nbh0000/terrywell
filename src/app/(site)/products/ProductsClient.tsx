"use client";

import { getDb } from "@/lib/db";
import { Loading, getQuery, usePageData } from "@/lib/page";
import { isNewProduct } from "@/lib/product-badge";
import { getSetting } from "@/lib/site";
import { ProductGrid } from "./ProductGrid";

// reference/01 "제품 소개 페이지" 시안: 탭(BEST·ALL·NEW·TOWEL), 검색, Products 3열 그리드
// NEW 탭은 카테고리가 아니라 출시일 기준으로 자동으로 정한다 (관리자 > 사이트 설정의 NEW 표시 기간)
export function ProductsClient() {
  const { data } = usePageData(async () => {
    const db = getDb();
    const [categories, products, { new_days }] = await Promise.all([
      db.select("categories", { order: [{ column: "sort_order" }] }),
      db.select("products", { where: { is_visible: true }, order: [{ column: "sort_order" }] }),
      getSetting("products"),
    ]);
    const others = categories.filter((c) => c.slug !== "new");
    // 시안 순서: BEST · ALL · NEW · 나머지 카테고리
    const tabs = [
      ...others.slice(0, 1).map((c) => ({ slug: c.slug, name: c.name })),
      { slug: "all", name: "ALL" },
      { slug: "new", name: "NEW" },
      ...others.slice(1).map((c) => ({ slug: c.slug, name: c.name })),
    ];
    const sp = getQuery();
    const t = sp.get("tab");
    const tab = t && tabs.some((x) => x.slug === t) ? t : "all";
    const q = (sp.get("q") ?? "").trim();
    return {
      tabs,
      tab,
      q,
      products: products.map((p) => ({
        id: p.id,
        slug: p.slug,
        nameEn: p.name_en,
        nameKo: p.name_ko,
        image: p.images[0] ?? null,
        price: p.base_price,
        categories: p.category_slugs,
        isNew: isNewProduct(p, new_days),
      })),
    };
  });
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 pb-24 pt-12 md:px-10 md:pt-[5%]">
      {!data ? <Loading /> : <ProductGrid tabs={data.tabs} initialTab={data.tab} initialQ={data.q} products={data.products} />}
    </section>
  );
}
