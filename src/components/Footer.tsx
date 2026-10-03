import { IMAGES } from "@/content/images";
import { getSetting } from "@/lib/site";

// reference/01 시안 푸터: 왼쪽 심볼 로고 + 대표 전화, 오른쪽 사업자 정보
export async function Footer() {
  const c = await getSetting("company");

  return (
    <footer className="mt-auto border-t border-line bg-paper">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-16 md:py-14">
        <div className="flex items-center gap-6 md:gap-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IMAGES.logoFooter} alt="TERRYWELL" className="h-[84px] w-auto md:h-[102px]" />
          <div>
            <a href={`tel:${c.phone.replace(/[^0-9]/g, "")}`} className="block font-serif text-[1.6rem] font-normal leading-none tracking-[0.01em] text-ink md:text-[2rem]" style={{ fontFamily: "var(--font-footer-num)" }}>
              {c.phone}
            </a>
            <p className="mt-2.5 text-[12px] text-ink/80">
              {c.hours_weekday} / {c.hours_lunch}
            </p>
          </div>
        </div>
        <div className="text-[12px] leading-[1.6] text-ink/85">
          <p className="font-semibold text-ink">{c.company_name}</p>
          <p>사업장 주소&nbsp; {c.address}</p>
          <p>대표자명&nbsp; {c.ceo}</p>
          <p>사업자등록번호&nbsp; {c.business_number}</p>
          <p>통신판매업번호&nbsp; {c.mail_order_number}</p>
          <p className="mt-3">{c.phone}</p>
          <p>{c.email}</p>
        </div>
      </div>
    </footer>
  );
}
