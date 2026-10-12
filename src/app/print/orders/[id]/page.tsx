import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { kstToday } from "@/lib/kst";
import { getSetting } from "@/lib/site";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "거래 서류", robots: { index: false } };

const DOCS = { quote: "견 적 서", statement: "거 래 명 세 서" } as const;
const won = (n: number) => n.toLocaleString("ko-KR");

// 마이페이지 > 주문 내역에서 여는 견적서 · 거래명세서 (브라우저 인쇄 / PDF 저장)
// 비회원 주문 조회에서 연 경우 주문번호 + 연락처 뒷자리(?k=)로 확인한다
export default async function PrintOrder({ params, searchParams }: PageProps<"/print/orders/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const type = sp.doc === "quote" ? "quote" : "statement";
  const db = getDb({ admin: true });
  const order = await db.get("orders", { id });
  if (!order) notFound();
  const user = await getCurrentUser();
  const phoneKey = String(order.recipient.phone ?? "").replace(/\D/g, "").slice(-4);
  const allowed = (user && (user.id === order.user_id || user.role === "admin")) || (typeof sp.k === "string" && phoneKey.length === 4 && sp.k === phoneKey);
  if (!allowed) notFound();

  const [items, c, buyer] = await Promise.all([
    db.select("order_items", { where: { order_id: order.id } }),
    getSetting("company"),
    db.get("profiles", { id: order.user_id }),
  ]);
  const tax = order.tax_invoice as Record<string, string> | null;
  const buyerName = tax?.company_name || buyer?.company_name || order.recipient.name || buyer?.name || "";
  const date = new Date(type === "quote" ? kstToday() : order.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  const cell = "border border-ink/70 px-2.5 py-1.5";
  // 배송비도 부가세 포함 금액이라 공급가액·세액으로 나눠 합계에 더한다
  const shipSupply = Math.round(order.shipping_fee / 1.1);
  const shipVat = order.shipping_fee - shipSupply;
  return (
    <div className="min-h-screen bg-[#ededed] py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[794px] justify-end gap-2 px-4 print:hidden">
        <PrintButton />
      </div>
      <article className="mx-auto w-full max-w-[794px] bg-white px-10 py-12 text-[12.5px] leading-[1.5] text-ink shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none">
        <h1 className="text-center text-[26px] font-bold tracking-[0.4em]">{DOCS[type]}</h1>
        <p className="mt-1 text-center text-[11.5px] text-muted">{type === "statement" ? "(공급받는자 보관용)" : ""}</p>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="space-y-1.5 self-end">
            <p className="text-[16px] font-semibold">{buyerName} 귀하</p>
            <p>일자: {date}</p>
            <p>주문번호: {order.order_no}</p>
            {type === "quote" && <p>아래와 같이 견적합니다.</p>}
          </div>
          <table className="w-full border-collapse text-[11.5px]">
            <tbody>
              <tr><th rowSpan={5} className={`${cell} w-6 bg-tile text-center font-medium [writing-mode:vertical-rl]`}>공급자</th><th className={`${cell} w-[72px] bg-tile font-medium`}>등록번호</th><td className={cell} colSpan={3}>{c.business_number}</td></tr>
              <tr><th className={`${cell} bg-tile font-medium`}>상호</th><td className={cell}>{c.company_name}</td><th className={`${cell} w-[44px] bg-tile font-medium`}>대표</th><td className={cell}>{c.ceo} <span className="text-muted">(인)</span></td></tr>
              <tr><th className={`${cell} bg-tile font-medium`}>주소</th><td className={cell} colSpan={3}>{c.address}</td></tr>
              <tr><th className={`${cell} bg-tile font-medium`}>전화</th><td className={cell} colSpan={3}>{c.phone}</td></tr>
              <tr><th className={`${cell} bg-tile font-medium`}>이메일</th><td className={cell} colSpan={3}>{c.email}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between border-y-2 border-ink px-2 py-2.5 text-[14px]">
          <span className="font-semibold">합계금액 (부가세 포함, 배송비 포함)</span>
          <span className="text-[17px] font-bold">₩ {won(order.total_amount)}</span>
        </div>

        <table className="mt-5 w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-tile">
              {["No", "품목", "옵션", "수량", "단가", "공급가액", "세액"].map((h) => (
                <th key={h} className={`${cell} font-medium`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const supply = Math.round(it.line_amount / 1.1);
              return (
                <tr key={it.id}>
                  <td className={`${cell} text-center`}>{i + 1}</td>
                  <td className={cell}>{it.product_name}</td>
                  <td className={cell}>{it.color_name ?? "-"}</td>
                  <td className={`${cell} text-right`}>{won(it.quantity)}</td>
                  <td className={`${cell} text-right`}>{won(it.unit_price)}</td>
                  <td className={`${cell} text-right`}>{won(supply)}</td>
                  <td className={`${cell} text-right`}>{won(it.line_amount - supply)}</td>
                </tr>
              );
            })}
            {order.shipping_fee > 0 && (
              <tr>
                <td className={`${cell} text-center`}>{items.length + 1}</td>
                <td className={cell} colSpan={2}>배송비</td>
                <td className={`${cell} text-right`}>1</td>
                <td className={`${cell} text-right`}>{won(order.shipping_fee)}</td>
                <td className={`${cell} text-right`}>{won(shipSupply)}</td>
                <td className={`${cell} text-right`}>{won(shipVat)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td className={`${cell} bg-tile text-center`} colSpan={5}>합계</td>
              <td className={`${cell} text-right`}>{won(order.supply_amount + shipSupply)}</td>
              <td className={`${cell} text-right`}>{won(order.vat_amount + shipVat)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-6 space-y-1 text-[11.5px] text-ink/80">
          {type === "quote" ? (
            <>
              <p>· 견적 유효기간: 발행일로부터 30일</p>
              <p>· 맞춤 제작 상품으로 디자인 확정 후 제작이 시작됩니다.</p>
            </>
          ) : (
            <p>· 결제 상태: {order.payment ? "결제 완료" : "결제 전"}</p>
          )}
          {tax && <p>· 세금계산서 발행 요청: {tax.company_name} ({tax.business_number})</p>}
        </div>
      </article>
    </div>
  );
}
