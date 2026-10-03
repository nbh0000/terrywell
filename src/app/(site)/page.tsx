import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ImageBox } from "@/components/Placeholder";
import { getContent } from "@/lib/site";

export default async function Home() {
  const { hero, cards, banner } = await getContent("home");

  return (
    <>
      {/* 히어로: 화면 너비 가득 */}
      <section className="relative">
        <ImageBox src={hero.image} alt="TERRYWELL" className="h-[68svh] min-h-[420px] w-full md:h-[78svh]" label="HERO IMAGE" />
        <div className="absolute inset-0 mx-auto flex max-w-[1280px] flex-col justify-center px-5 md:px-8">
          <h1 className="font-serif text-[2.1rem] font-bold leading-none tracking-[0.05em] text-point sm:text-[2.8rem] md:text-[4.5rem]">{hero.title}</h1>
          <p className="mt-3 text-[15px] text-point/90 md:mt-4 md:text-xl">{hero.slogan}</p>
        </div>
      </section>

      {/* 카테고리 카드 4개 */}
      <section className="mx-auto grid w-full max-w-[1280px] grid-cols-2 gap-3 px-5 py-12 md:grid-cols-4 md:gap-6 md:px-8 md:py-20">
        {cards.map((c) => (
          <Link key={c.title} href={c.href} className="group relative block overflow-hidden rounded-[28%/20%]">
            <ImageBox src={c.image} alt={c.title} ratio="3 / 4" className="transition-transform duration-700 ease-out group-hover:scale-[1.03]" label="" tone="mid" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 text-center text-white">
              <span className="font-display text-lg font-medium md:text-xl">{c.title}</span>
              <span className="mt-0.5 text-xs md:text-sm">{c.subtitle}</span>
            </div>
          </Link>
        ))}
      </section>

      {/* 신제품 배너 */}
      <section className="relative">
        <ImageBox src={banner.image} alt={banner.title} className="h-[52svh] min-h-[340px] w-full" label="BANNER IMAGE" tone="mid" />
        <div className="absolute inset-0 mx-auto flex max-w-[1280px] flex-col justify-center px-5 md:px-8">
          <span className="mb-3 w-fit rounded-[3px] bg-point px-2 py-0.5 font-display text-[11px] font-medium tracking-wider text-white">{banner.badge}</span>
          <h2 className="max-w-[10ch] font-display text-3xl font-medium leading-tight text-white drop-shadow-sm md:text-5xl">{banner.title}</h2>
          <Link
            href={banner.href}
            className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-[3px] border border-white/80 bg-white/90 px-4 py-2 text-sm text-ink transition-colors hover:bg-white"
          >
            {banner.button} <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </>
  );
}
