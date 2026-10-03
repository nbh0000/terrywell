import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/site";

export const metadata: Metadata = { title: "커스텀 라벨" };

// reference/01 커스텀 라벨 시안: 사진, CUSTOM LABEL, 설명, [견적문의 바로가기]
export default async function CustomLabelPage() {
  const c = await getContent("customLabel");
  return (
    <section className="mx-auto w-full max-w-[1440px] px-5 pb-24 pt-10 md:px-[8%] md:pb-[11%] md:pt-[5%]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.image} alt="라벨을 붙인 수건" className="w-full object-cover md:w-[60%]" style={{ aspectRatio: "567 / 377" }} />
      <h1 className="mt-10 font-display text-[clamp(1.4rem,2.1vw,2rem)] font-semibold tracking-[-0.01em] text-ink md:mt-[3.4%]">{c.title}</h1>
      <div className="mt-2 space-y-[1.4em] text-[15px] leading-[1.6] text-ink md:text-[clamp(15px,1.45vw,21px)]">
        {c.paragraphs.map((lines, i) => (
          <p key={i}>
            {lines.map((l, j) => (
              <span key={j} className="md:block">{l} </span>
            ))}
          </p>
        ))}
      </div>
      <div className="mt-14 flex flex-col gap-3 sm:flex-row md:mt-[7%]">
        <Link href="/quote" className="flex h-[52px] items-center bg-ink px-6 text-[16px] text-white transition-colors hover:bg-ink/85 sm:w-[340px]">
          견적문의 바로가기
        </Link>
        <Link href="/products" className="flex h-[52px] items-center border border-ink px-6 text-[16px] text-ink transition-colors hover:bg-ink hover:text-white sm:w-[340px]">
          라벨 디자인 시작하기
        </Link>
      </div>
    </section>
  );
}
