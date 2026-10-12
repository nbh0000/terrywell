import Link from "next/link";
import { MessageCircleQuestion } from "lucide-react";
import { IMAGES } from "@/content/images";
import { getSetting } from "@/lib/site";

// reference/01 시안 푸터: 왼쪽 심볼 로고 + 대표 전화 + 1:1 문의, 오른쪽 사업자 정보 + 인스타그램
export async function Footer() {
  const c = await getSetting("company");

  return (
    <footer className="mt-auto border-t border-line bg-paper">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-16 md:py-14">
        <div className="flex items-center gap-6 md:gap-8">
          <Link href="/" aria-label="TERRYWELL 처음 화면으로" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMAGES.logoFooter} alt="TERRYWELL" className="h-[84px] w-auto md:h-[102px]" />
          </Link>
          <div>
            <a href={`tel:${c.phone.replace(/[^0-9]/g, "")}`} className="block font-serif text-[1.6rem] font-normal leading-none tracking-[0.01em] text-ink md:text-[2rem]" style={{ fontFamily: "var(--font-footer-num)" }}>
              {c.phone}
            </a>
            <p className="mt-2.5 text-[12px] text-ink/80">
              {c.hours_weekday} / {c.hours_lunch}
            </p>
            <Link
              href="/qna/inquiry"
              className="mt-3 inline-flex items-center gap-1.5 rounded-[6px] border border-ink/20 bg-white px-3 py-1.5 text-[12.5px] text-ink transition-colors hover:border-point hover:text-point"
            >
              <MessageCircleQuestion size={14} strokeWidth={1.7} /> 1:1 문의
            </Link>
          </div>
        </div>
        <div className="flex items-start gap-8">
          <div className="text-[12px] leading-[1.6] text-ink/85">
            <p className="font-semibold text-ink">{c.company_name}</p>
            <p>사업장 주소&nbsp; {c.address}</p>
            <p>대표자명&nbsp; {c.ceo}</p>
            <p>사업자등록번호&nbsp; {c.business_number}</p>
            {c.mail_order_number && <p>통신판매업번호&nbsp; {c.mail_order_number}</p>}
            <p className="mt-3">{c.phone}</p>
            <p>{c.email}</p>
            <p className="mt-3 flex gap-3 text-ink/60">
              <Link href="/terms" className="hover:text-ink">이용약관</Link>
              <Link href="/privacy" className="font-medium hover:text-ink">개인정보처리방침</Link>
            </p>
          </div>
          {c.instagram && (
            <a href={c.instagram} target="_blank" rel="noopener noreferrer" aria-label="테리웰 인스타그램 (새 창)" className="shrink-0 text-ink transition-colors hover:text-point">
              <InstagramIcon />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
