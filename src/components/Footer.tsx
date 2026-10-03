import { IMAGES } from "@/content/images";
import { getSetting } from "@/lib/site";

export async function Footer() {
  const c = await getSetting("company");
  const rows = [
    c.company_name,
    `사업장 주소 ${c.address}`,
    `대표자 ${c.ceo}`,
    `사업자등록번호 ${c.business_number}`,
    `통신판매업 신고번호 ${c.mail_order_number}`,
    `전화 ${c.phone}`,
    `이메일 ${c.email}`,
  ];

  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10 px-5 py-12 md:flex-row md:items-start md:justify-between md:px-8 md:py-14">
        <div className="flex items-start gap-5">
          {IMAGES.logoSymbol ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={IMAGES.logoSymbol} alt="TERRYWELL" className="h-14 w-auto" />
          ) : (
            <span className="font-serif text-sm font-bold tracking-[0.06em] text-point">TERRYWELL</span>
          )}
          <div>
            <a href={`tel:${c.phone.replace(/[^0-9]/g, "")}`} className="block text-2xl font-medium tracking-tight text-ink md:text-[1.75rem]">
              {c.phone}
            </a>
            <p className="mt-2 text-xs text-muted">
              {c.hours_weekday} / {c.hours_lunch}
            </p>
          </div>
        </div>
        <ul className="space-y-1 text-xs leading-relaxed text-muted md:text-right">
          {rows.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
