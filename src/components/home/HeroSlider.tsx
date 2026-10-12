"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeSlide } from "@/lib/site";

// 메인 슬라이드: interval 마다 다음 장으로 넘어가고, 장 전체가 링크다.
// 마우스를 올리거나 탭이 안 보이면 멈춘다. 움직임 줄이기 설정이면 자동으로 넘기지 않는다.
export function HeroSlider({ slides, intervalSec }: { slides: HomeSlide[]; intervalSec: number }) {
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;
  const paused = hover || hidden;
  const sec = Math.max(2, intervalSec || 5);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused || reduced) return;
    const t = setTimeout(() => go(index + 1), sec * 1000);
    return () => clearTimeout(t);
  }, [index, paused, reduced, count, sec, go]);

  if (!count) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="메인 배너"
      className="relative h-[min(78svh,640px)] min-h-[380px] w-full overflow-hidden bg-cloud lg:h-[calc(100svh-78px)] lg:max-h-[880px] lg:min-h-[520px]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      {slides.map((s, i) => (
        <Link
          key={i}
          href={s.href || "/"}
          aria-hidden={i !== index}
          tabIndex={i === index ? 0 : -1}
          aria-label={`${s.title} ${s.button || ""}`.trim()}
          className={`absolute inset-0 block transition-opacity duration-1000 ease-out ${i === index ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"}`}
        >
          {s.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={s.image}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${i === index && !reduced ? "scale-[1.035]" : "scale-100"}`}
            />
          )}
          {s.style === "brand" ? <BrandCopy s={s} active={i === index} /> : <ProductCopy s={s} active={i === index} />}
        </Link>
      ))}

      {count > 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2 md:bottom-7">
          {slides.map((s, i) => {
            const onBrand = slides[index].style === "brand";
            return (
              <button key={i} type="button" onClick={() => go(i)} aria-label={`${i + 1}번째 배너 보기`} aria-current={i === index} className="grid h-6 w-9 place-items-center">
                <span className={`block h-[3px] w-full overflow-hidden rounded-[2px] ${onBrand ? "bg-point/20" : "bg-white/45"}`}>
                  <span
                    key={`${index}-${paused}`}
                    className={`block h-full ${onBrand ? "bg-point" : "bg-white"} ${i === index ? (paused || reduced ? "w-full" : "w-0 animate-[tw-progress_linear_forwards]") : "w-0"}`}
                    style={i === index && !paused && !reduced ? { animationDuration: `${sec}s` } : undefined}
                  />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** 지금 장이 되면 글자가 아래에서 살짝 떠오른다 */
function rise(active: boolean, delayMs: number) {
  return {
    className: `transition-all duration-700 ease-out ${active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`,
    style: { transitionDelay: active ? `${delayMs}ms` : "0ms" },
  };
}

function BrandCopy({ s, active }: { s: HomeSlide; active: boolean }) {
  const t = rise(active, 150);
  const sub = rise(active, 350);
  return (
    <div className="absolute left-[5.8%] top-1/2 -translate-y-1/2">
      <h2 className={`font-serif text-[clamp(2.4rem,6vw,6.4rem)] font-extrabold leading-[0.95] tracking-[0.005em] text-point ${t.className}`} style={t.style}>
        {s.title}
      </h2>
      {s.subtitle && (
        <p className={`mt-[0.6vw] font-display text-[clamp(0.85rem,1.75vw,1.9rem)] font-light tracking-[-0.005em] text-point ${sub.className}`} style={sub.style}>
          {s.subtitle}
        </p>
      )}
    </div>
  );
}

function ProductCopy({ s, active }: { s: HomeSlide; active: boolean }) {
  const [first, ...rest] = s.title.split(" ");
  const t = rise(active, 150);
  const sub = rise(active, 300);
  const btn = rise(active, 450);
  return (
    <>
      {s.badge && (
        <span
          className={`absolute right-[3%] top-[8%] grid w-[clamp(64px,10vw,140px)] place-items-center bg-point font-serif text-[clamp(0.75rem,1.6vw,1.5rem)] text-white transition-all duration-700 ${active ? "rotate-0 scale-100 opacity-100" : "-rotate-12 scale-75 opacity-0"}`}
          style={{
            aspectRatio: "96 / 50",
            transitionDelay: active ? "500ms" : "0ms",
            clipPath:
              "polygon(50% 0%, 58% 14%, 72% 4%, 74% 22%, 92% 16%, 86% 36%, 100% 44%, 86% 56%, 94% 78%, 74% 74%, 70% 96%, 57% 82%, 46% 100%, 39% 80%, 24% 94%, 24% 72%, 6% 76%, 13% 56%, 0% 44%, 15% 34%, 8% 14%, 27% 20%, 31% 2%, 42% 16%)",
          }}
        >
          {s.badge}
        </span>
      )}
      <div className="absolute left-[4.2%] top-1/2 -translate-y-1/2">
        <h2 className={`font-display text-[clamp(1.7rem,4vw,4rem)] font-normal leading-[1.15] text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.14)] ${t.className}`} style={t.style}>
          <span className="block">{first}</span>
          {rest.length > 0 && <span className="block">{rest.join(" ")}</span>}
        </h2>
        {s.subtitle && (
          <p className={`mt-2 text-[clamp(0.85rem,1.2vw,1.1rem)] text-white/90 ${sub.className}`} style={sub.style}>
            {s.subtitle}
          </p>
        )}
        {s.button && (
          <span className={`mt-[1.8vw] inline-flex items-center gap-1.5 rounded-[6px] bg-white/95 px-[1.1em] py-[0.45em] text-[clamp(0.75rem,1.05vw,1rem)] text-point ${btn.className}`} style={btn.style}>
            {s.button} <span aria-hidden>→</span>
          </span>
        )}
      </div>
    </>
  );
}
