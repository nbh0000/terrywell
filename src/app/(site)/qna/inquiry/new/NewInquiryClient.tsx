"use client";

import { CenterShell } from "@/components/support/CenterShell";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Loading, getQuery, usePageData } from "@/lib/page";
import { InquiryForm } from "./InquiryForm";

export function NewInquiryClient() {
  const { data } = usePageData(async () => {
    const user = await requireUser("/qna/inquiry/new");
    const db = getDb();
    const [orders, faqs] = await Promise.all([
      db.select("orders", { where: { user_id: user.id }, order: [{ column: "created_at", ascending: false }], limit: 30 }),
      db.select("faqs", { where: { is_visible: true }, order: [{ column: "sort_order" }] }),
    ]);
    return { orders, faqs, order: getQuery().get("order") ?? "" };
  });
  return (
    <CenterShell title="1:1 문의하기">
      {!data ? (
        <Loading />
      ) : (
        <InquiryForm
          orders={data.orders.filter((o) => o.status !== "pending").map((o) => ({ no: o.order_no, date: new Date(o.created_at).toLocaleDateString("ko-KR") }))}
          faqs={data.faqs.map((f) => ({ id: f.id, category: f.category, question: f.question, answer: f.answer_html }))}
          initialOrderNo={data.order}
        />
      )}
    </CenterShell>
  );
}
