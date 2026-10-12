"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NewBadge } from "@/components/shop/NewBadge";

export interface RailItem {
  key: string;
  href: string;
  image: string | null;
  nameKo: string;
  option: string;
  price: number;
  isNew: boolean;
}

// 제품 바로가기: 가로로 넘기는 줄. 아래 막대는 지금 보이는 위치
export function ProductRail({ title, items }: { title: string; items: RailItem[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const [view, setView] = useState({ left: 0, width: 1 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = () => setView({ left: el.scrollLeft / Math.max(1, el.scrollWidth), width: el.clientWidth / Math.max(1, el.scrollWidth) });
    on();
    el.addEventListener("scroll", on, { passive: true });
    const ro = new ResizeObserver(on);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", on);
      ro.disconnect();
    };
  }, []);

  if (!items.length) return null;
  const scrollable = view.width < 0.999;
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className="mx-auto w-full max-w-[1440px] px-5 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20">
      <div className="mb-5 flex items-end justify-between">
        <h2 className="font-display text-[19px] font-medium md:text-[22px]">{title}</h2>
        <div className="flex items-center gap-3">
          <Link href="/products" className="text-[13px] text-muted hover:text-ink">전체 보기</Link>
          {scrollable && (
            <div className="hidden gap-1 md:flex">
              <button type="button" onClick={() => scroll(-1)} aria-label="이전 제품" disabled={view.left <= 0.001} className="grid size-9 place-items-center rounded-[6px] border border-line hover:border-ink/40 disabled:opacity-30">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={() => scroll(1)} aria-label="다음 제품" disabled={view.left + view.width >= 0.999} className="grid size-9 place-items-center rounded-[6px] border border-line hover:border-ink/40 disabled:opacity-30">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
      <ul ref={ref} className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-2 overflow-x-auto px-5 md:scroll-px-0 [scrollbar-width:none] md:mx-0 md:gap-3 md:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((it) => (
          <li key={it.key} className="w-[62%] shrink-0 snap-start sm:w-[38%] md:w-[calc((100%-2.25rem)/4)] xl:w-[calc((100%-3.75rem)/6)]">
            <Link href={it.href} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden bg-tile">
                {it.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.image} alt="" className="h-full w-full object-contain p-[12%] mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.04]" />
                )}
                {it.isNew && <NewBadge className="absolute left-3 top-3" />}
              </div>
              <p className="mt-2.5 text-[13.5px] leading-snug">
                {it.nameKo}
                {it.option && <span className="text-muted"> · {it.option}</span>}
              </p>
              <p className="mt-0.5 text-[13px] font-medium">{it.price.toLocaleString("ko-KR")}원~</p>
            </Link>
          </li>
        ))}
      </ul>
      {scrollable && (
        <div className="relative mx-auto mt-6 h-[2px] w-full max-w-[540px] bg-line" aria-hidden>
          <span className="absolute inset-y-0 bg-ink transition-[left] duration-150" style={{ left: `${view.left * 100}%`, width: `${view.width * 100}%` }} />
        </div>
      )}
    </section>
  );
}
