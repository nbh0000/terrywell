"use client";

import Link from "next/link";
import { HeroSlider } from "@/components/home/HeroSlider";
import { ProductRail, type RailItem } from "@/components/home/ProductRail";
import { getDb } from "@/lib/db";
import { kstToday } from "@/lib/kst";
import { Loading, usePageData } from "@/lib/page";
import { isNewProduct } from "@/lib/product-badge";
import { getContent, getSetting } from "@/lib/site";

async function loadHome() {
  const db = getDb();
  const [home, { new_days }, products] = await Promise.all([
    getContent("home"),
    getSetting("products"),
    db.select("products", { where: { is_visible: true }, order: [{ column: "sort_order" }] }),
  ]);

  // 기간을 정한 슬라이드는 한국 날짜 기준으로 그 기간에만 보인다
  const today = kstToday();
  const slides = home.slides.filter((s) => (!s.start || s.start <= today) && (!s.end || today <= s.end));

  // 색상이 있는 제품은 색상별로 한 칸씩 (누르면 그 색상을 고른 상태로 열린다)
  const items: RailItem[] = [];
  for (const p of products) {
    const isNew = isNewProduct(p, new_days);
    const colors = await db.select("product_colors", { where: { product_id: p.id }, order: [{ column: "sort_order" }] });
    if (!colors.length) {
      items.push({ key: p.id, href: `/products/${p.slug}`, image: p.images[0]?.url ?? null, nameKo: p.name_ko, option: "", price: p.base_price, isNew });
      continue;
    }
    for (const c of colors) {
      items.push({
        key: c.id,
        href: `/products/${p.slug}?color=${c.id}`,
        image: c.images[1]?.url ?? c.images[0]?.url ?? p.images[0]?.url ?? null,
        nameKo: p.name_ko,
        option: c.name,
        price: p.base_price,
        isNew,
      });
    }
  }
  return { home, slides, items };
}

// 2026-10 고객 요청 배치: 크게 넘어가는 슬라이드 → 제품 바로가기 → 브랜드 소개로 가는 이미지
export default function Home() {
  const { data } = usePageData(loadHome);
  if (!data) return <Loading className="min-h-[70vh]" />;
  const { home, slides, items } = data;
  const b = home.brand;
  return (
    <>
      <HeroSlider slides={slides} intervalSec={home.interval_sec} />
      <ProductRail title={home.products_title} items={items} />

      {/* 브랜드 소개로 가는 이미지: 마우스를 올리면 살짝 어두워지며 BRAND (터치 화면은 처음부터 글자 표시) */}
      <section className="mx-auto w-full max-w-[1440px] px-5 pb-20 md:px-10 md:pb-28">
        <Link href={b.href} className="group relative block aspect-[4/3] overflow-hidden bg-cloud sm:aspect-[21/9]" aria-label={`${b.label} ${b.caption}`.trim()}>
          {b.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]" />
          )}
          <span className="absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-black/35 group-focus-visible:bg-black/35 [@media(hover:hover)]:bg-black/0" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="text-center text-white transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:hover)]:opacity-0">
              <span className="block font-serif text-[clamp(2rem,4.4vw,4.2rem)] font-bold tracking-[0.18em]">{b.label}</span>
              {b.caption && <span className="mt-2 block text-[clamp(0.85rem,1.2vw,1.1rem)] tracking-[0.04em]">{b.caption}</span>}
            </span>
          </span>
        </Link>
      </section>
    </>
  );
}
