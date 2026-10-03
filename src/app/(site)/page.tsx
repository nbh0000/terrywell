import Link from "next/link";
import { getContent } from "@/lib/site";

// reference/01 "인트로 페이지" 시안 배치. 시안 폭 858px 기준 비율을 vw 로 옮겼다.
export default async function Home() {
  const { hero, cards, banner } = await getContent("home");

  return (
    <>
      {/* 히어로: 커튼 사진, 왼쪽에 TERRYWELL + 슬로건 */}
      <section className="relative w-full overflow-hidden bg-cloud" style={{ aspectRatio: "858 / 450" }}>
        {hero.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute left-[5.8%] top-[38%]">
          <h1 className="font-serif text-[clamp(2.2rem,5.15vw,5.6rem)] font-extrabold leading-[0.95] tracking-[0.005em] text-point">
            {hero.title}
          </h1>
          <p className="mt-[0.5vw] font-display text-[clamp(0.85rem,1.62vw,1.75rem)] font-light tracking-[-0.005em] text-point">
            {hero.slogan}
          </p>
        </div>
      </section>

      {/* 카테고리 카드 4개 */}
      <section className="w-full px-[2.6%] pb-[7.6%] pt-[4.9%]">
        <div className="grid grid-cols-2 gap-[3vw] md:grid-cols-4 md:gap-[2.1%]">
          {cards.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="group relative block overflow-hidden bg-cloud [border-radius:24%/19%]"
              style={{ aspectRatio: "190 / 238" }}
            >
              {c.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt="" className="absolute inset-0 h-full w-full scale-[1.06] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.1]" />
              )}
              <div className="absolute inset-x-0 top-[44%] -translate-y-1/2 text-center font-display leading-tight text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.18)]">
                <div className="text-[clamp(1rem,1.75vw,1.6rem)]">{c.title}</div>
                <div className="text-[clamp(0.8rem,1.45vw,1.3rem)]">{c.subtitle}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 신제품 배너 */}
      <section className="relative w-full overflow-hidden bg-cloud" style={{ aspectRatio: "858 / 259" }}>
        {banner.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <span
          className="absolute right-[2.6%] top-[7%] grid w-[11.2%] place-items-center bg-point font-serif text-[clamp(0.7rem,1.6vw,1.5rem)] text-white"
          style={{
            aspectRatio: "96 / 50",
            clipPath:
              "polygon(50% 0%, 58% 14%, 72% 4%, 74% 22%, 92% 16%, 86% 36%, 100% 44%, 86% 56%, 94% 78%, 74% 74%, 70% 96%, 57% 82%, 46% 100%, 39% 80%, 24% 94%, 24% 72%, 6% 76%, 13% 56%, 0% 44%, 15% 34%, 8% 14%, 27% 20%, 31% 2%, 42% 16%)",
          }}
        >
          {banner.badge}
        </span>
        <div className="absolute left-[3.8%] top-[27%]">
          {/* 시안처럼 첫 단어 / 나머지 두 줄 */}
          <h2 className="font-display text-[clamp(1.5rem,3.45vw,3.4rem)] font-normal leading-[1.18] text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.12)]">
            <span className="block">{banner.title.split(" ")[0]}</span>
            <span className="block">{banner.title.split(" ").slice(1).join(" ")}</span>
          </h2>
          <Link
            href={banner.href}
            className="mt-[1.6vw] inline-flex items-center gap-1 rounded-full border border-point/60 bg-white px-[1.1em] py-[0.35em] text-[clamp(0.7rem,1.05vw,1rem)] text-point transition-colors hover:bg-point hover:text-white"
          >
            {banner.button} <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
