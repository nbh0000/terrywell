import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { STATUS_LABEL } from "@/lib/orders";
import { won } from "@/lib/pricing";

export const metadata: Metadata = { title: "거래내역 출력" };

// 주문별 견적서 · 거래명세서 출력 (새 창에서 인쇄 또는 PDF 저장)
export default async function DocumentsPage() {
  const user = await requireUser("/mypage/documents");
  const db = getDb();
  const orders = (await db.select("orders", { where: { user_id: user.id }, order: [{ column: "created_at", ascending: false }] })).filter((o) => o.status !== "pending");
  if (!orders.length)
    return (
      <p className="py-16 text-center text-[14px] text-muted">
        출력할 거래내역이 없습니다. <Link href="/products" className="text-ink underline">제품 보러 가기</Link>
      </p>
    );
  const rows = await Promise.all(orders.map(async (o) => ({ o, items: await db.select("order_items", { where: { order_id: o.id } }) })));
  const btn = "inline-flex h-9 items-center rounded-[6px] border border-line bg-white px-3 text-[13px] hover:border-ink/40";
  return (
    <div>
      <p className="mb-4 text-[13.5px] text-muted">주문을 골라 견적서나 거래명세서를 새 창에서 열고, [인쇄 · PDF 저장]으로 출력할 수 있습니다.</p>
      <div className="overflow-x-auto border-t border-ink/70">
        <table className="w-full min-w-[640px] text-[14px]">
          <thead>
            <tr className="border-b border-line text-left text-[13px] text-muted">
              <th className="py-3 font-normal">주문일</th>
              <th className="py-3 font-normal">주문번호</th>
              <th className="py-3 font-normal">상품</th>
              <th className="py-3 text-right font-normal">금액</th>
              <th className="py-3 text-center font-normal">상태</th>
              <th className="py-3 text-right font-normal">출력</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ o, items }) => (
              <tr key={o.id} className="border-b border-line">
                <td className="py-3.5 text-muted">{new Date(o.created_at).toLocaleDateString("ko-KR")}</td>
                <td className="py-3.5">{o.order_no}</td>
                <td className="py-3.5">
                  {items[0]?.product_name ?? "-"}
                  {items.length > 1 ? ` 외 ${items.length - 1}건` : ""}
                </td>
                <td className="py-3.5 text-right">{won(o.total_amount)}</td>
                <td className="py-3.5 text-center text-[13px]">{STATUS_LABEL[o.status]}</td>
                <td className="py-3.5">
                  <div className="flex justify-end gap-1.5">
                    <a href={`/print/orders/${o.id}?doc=quote`} target="_blank" rel="noopener" className={btn}>견적서</a>
                    <a href={`/print/orders/${o.id}?doc=statement`} target="_blank" rel="noopener" className={btn}>거래명세서</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
