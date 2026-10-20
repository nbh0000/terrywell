"use client";

import { CenterShell } from "@/components/support/CenterShell";
import { getDb } from "@/lib/db";
import { Loading, usePageData } from "@/lib/page";
import { FaqList } from "./FaqList";

// 자주 묻는 질문 (관리자 > 자주 묻는 질문에서 관리)
export function QnaClient() {
  const { data: faqs } = usePageData(() => getDb().select("faqs", { where: { is_visible: true }, order: [{ column: "sort_order" }] }));
  return (
    <CenterShell title="자주 묻는 질문">
      {!faqs ? <Loading /> : <FaqList faqs={faqs.map((f) => ({ id: f.id, category: f.category, question: f.question, answer: f.answer_html }))} />}
    </CenterShell>
  );
}
