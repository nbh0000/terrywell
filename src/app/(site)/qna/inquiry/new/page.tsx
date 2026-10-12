import type { Metadata } from "next";
import { CenterShell } from "@/components/support/CenterShell";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { InquiryForm } from "./InquiryForm";

export const metadata: Metadata = { title: "1:1 문의하기" };

export default async function NewInquiryPage({ searchParams }: PageProps<"/qna/inquiry/new">) {
  const user = await requireUser("/qna/inquiry/new");
  const sp = await searchParams;
  const db = getDb();
  const [orders, faqs] = await Promise.all([
    db.select("orders", { where: { user_id: user.id }, order: [{ column: "created_at", ascending: false }], limit: 30 }),
    db.select("faqs", { where: { is_visible: true }, order: [{ column: "sort_order" }] }),
  ]);
  return (
    <CenterShell title="1:1 문의하기">
      <InquiryForm
        orders={orders.filter((o) => o.status !== "pending").map((o) => ({ no: o.order_no, date: new Date(o.created_at).toLocaleDateString("ko-KR") }))}
        faqs={faqs.map((f) => ({ id: f.id, category: f.category, question: f.question, answer: f.answer_html }))}
        initialOrderNo={typeof sp.order === "string" ? sp.order : ""}
      />
    </CenterShell>
  );
}
