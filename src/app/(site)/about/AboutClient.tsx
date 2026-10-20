"use client";

import { AnimatedLogo } from "@/components/AnimatedLogo";
import { Reveal } from "@/components/Reveal";
import { Loading, usePageData } from "@/lib/page";
import { getContent } from "@/lib/site";

// 맨 위: 로고가 그려지며 나타나고 브랜드 문구 (2026-10 고객 시안 두 가지 중 흰 바탕형)
// 아래: reference/01 "회사 소개 페이지" 시안의 사진 + 계단식 Better / 본문 + 사진
export function AboutClient() {
  const { data: a } = usePageData(() => getContent("about"));
  if (!a) return <Loading className="min-h-[70vh]" />;
  return (
    <div className="mx-auto w-full max-w-[1440px]">
      <section className="flex flex-col items-center gap-10 px-5 pb-6 pt-16 md:flex-row md:items-center md:gap-[7%] md:px-[8%] md:pb-[4%] md:pt-[7%]">
        <AnimatedLogo className="w-[150px] shrink-0 md:w-[min(17vw,230px)]" />
        <div className="space-y-[1.35em] text-center text-[15px] leading-[1.7] text-point md:text-left md:text-[clamp(15px,1.3vw,19px)]">
          {a.intro.map((lines, i) => (
            <Reveal key={i} as="p" delay={1.9 + i * 0.25}>
              {lines.map((l, j) => (
                <span key={j} className={`block ${i === 0 ? "font-semibold" : ""}`}>{l}</span>
              ))}
            </Reveal>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-8 pt-14 md:flex-row md:items-center md:gap-[3%] md:pt-[6%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.image1} alt="" className="w-full object-cover md:w-[62%]" style={{ aspectRatio: "585 / 245" }} />
        <h1 className="px-5 font-display text-[clamp(2.4rem,4.9vw,4.6rem)] font-semibold leading-[1.12] text-ink md:px-0">
          {a.heading.map((w, i) => (
            <span key={i} className="block" style={{ paddingLeft: `${[0, 0.95, 2.4][i] ?? 0}em` }}>
              {w}
            </span>
          ))}
        </h1>
      </section>

      <section id="quality" className="flex scroll-mt-24 flex-col-reverse gap-10 px-5 pb-20 pt-16 md:flex-row md:items-center md:justify-between md:gap-[3%] md:px-[2.3%] md:pb-[11%] md:pt-[12%]">
        <div className="space-y-[1.6em] text-[15px] leading-[1.75] text-ink md:w-[42%] md:text-[clamp(14px,1.15vw,17px)]">
          {a.paragraphs.map((lines, i) => (
            <Reveal key={i} as="p" delay={i * 0.12}>
              {lines.map((l, j) => (
                <span key={j} className="md:block">{l} </span>
              ))}
            </Reveal>
          ))}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.image2} alt="" className="w-full object-cover md:w-[48.6%]" style={{ aspectRatio: "460 / 367" }} />
      </section>
    </div>
  );
}
