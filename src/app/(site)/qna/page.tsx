import type { Metadata } from "next";
import { CenterShell } from "@/components/support/CenterShell";
import { getDb } from "@/lib/db";
import { FaqList } from "./FaqList";

export const metadata: Metadata = { title: "Q&A" };

// 자주 묻는 질문 (관리자 > 자주 묻는 질문에서 관리)
export default async function QnaPage() {
  const faqs = await getDb().select("faqs", { where: { is_visible: true }, order: [{ column: "sort_order" }] });
  return (
    <CenterShell title="자주 묻는 질문">
      <FaqList faqs={faqs.map((f) => ({ id: f.id, category: f.category, question: f.question, answer: f.answer_html }))} />
    </CenterShell>
  );
}
