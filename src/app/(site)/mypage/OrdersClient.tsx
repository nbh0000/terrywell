"use client";

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { STATUS_LABEL } from "@/lib/orders";
import { Loading, usePageData } from "@/lib/page";
import { won } from "@/lib/pricing";

export function OrdersClient() {
  const { data } = usePageData(async () => {
    const user = await requireUser("/mypage");
    const db = getDb();
    const orders = (await db.select("orders", { where: { user_id: user.id }, order: [{ column: "created_at", ascending: false }] })).filter((o) => o.status !== "pending");
    return Promise.all(orders.map(async (o) => ({ o, items: await db.select("order_items", { where: { order_id: o.id } }) })));
  });
  if (!data) return <Loading />;
  if (!data.length)
    return (
      <p className="py-16 text-center text-[14px] text-muted">
        주문 내역이 없습니다. <Link href="/products" className="text-ink underline">제품 보러 가기</Link>
      </p>
    );
  return (
    <ul className="space-y-4">
      {data.map(({ o, items }) => (
        <li key={o.id} className="border border-line bg-paper p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 text-[13px]">
            <span className="text-muted">
              {new Date(o.created_at).toLocaleDateString("ko-KR")} · 주문번호 {o.order_no}
            </span>
            <span className="rounded-[4px] bg-ink px-2 py-0.5 text-[12px] text-white">{STATUS_LABEL[o.status]}</span>
          </div>
          <ul className="mt-3 space-y-1 text-[14px]">
            {items.map((it) => (
              <li key={it.id} className="flex justify-between gap-3">
                <span>
                  {it.product_name}
                  {it.color_name ? ` · ${it.color_name}` : ""} · {it.quantity.toLocaleString()}개{it.upload_id ? " (PDF)" : ""}
                </span>
                <span>{won(it.line_amount)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-line pt-3 text-[14px]">
            <span className="text-muted">{o.tracking_no ? `송장번호 ${o.tracking_no}` : `배송비 ${won(o.shipping_fee)}`}</span>
            <span className="font-semibold">{won(o.total_amount)}</span>
          </div>
          {/* 거래내역 출력 */}
          <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
            <a href={`/print/orders/${o.id}?doc=quote`} target="_blank" rel="noopener" className="inline-flex h-8 items-center rounded-[6px] border border-line px-3 hover:border-ink/40">견적서 출력</a>
            <a href={`/print/orders/${o.id}?doc=statement`} target="_blank" rel="noopener" className="inline-flex h-8 items-center rounded-[6px] border border-line px-3 hover:border-ink/40">거래명세서 출력</a>
            <Link href={`/qna/inquiry/new?order=${o.order_no}`} className="ml-auto inline-flex h-8 items-center px-1 text-muted underline">이 주문 문의하기</Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
