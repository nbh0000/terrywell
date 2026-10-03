import type { Metadata } from "next";
import { getContent } from "@/lib/site";

export const metadata: Metadata = { title: "회사 소개" };

// reference/01 "회사 소개 페이지" 시안: 사진 + 계단식 Better / 본문 + 사진
export default async function AboutPage() {
  const a = await getContent("about");
  return (
    <div className="mx-auto w-full max-w-[1440px]">
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
            <p key={i}>
              {lines.map((l, j) => (
                <span key={j} className="md:block">{l} </span>
              ))}
            </p>
          ))}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.image2} alt="" className="w-full object-cover md:w-[48.6%]" style={{ aspectRatio: "460 / 367" }} />
      </section>
    </div>
  );
}
