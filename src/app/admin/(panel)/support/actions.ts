// 자주 묻는 질문·1:1 문의 답변 (브라우저 → PHP /api/db, 관리자만)

import { getDb } from "@/lib/db";
import { go } from "@/lib/page";

// 글을 그냥 쓰면 빈 줄 기준으로 문단을 나눈다. HTML 이면 그대로
export function toHtml(body: string) {
  if (/<\w+[^>]*>/.test(body)) return body;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  return body
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export async function saveFaqAction(fd: FormData) {
  const db = getDb({ admin: true });
  const id = String(fd.get("id") ?? "");
  const question = String(fd.get("question") ?? "").trim().slice(0, 300);
  if (!question) return;
  const row = {
    category: String(fd.get("category") ?? "").trim().slice(0, 40) || "그 외",
    question,
    answer_html: toHtml(String(fd.get("answer") ?? "")),
    is_visible: fd.get("is_visible") === "on",
    sort_order: Number(fd.get("sort_order")) || 0,
  };
  if (id) await db.update("faqs", { id }, row);
  else await db.insert("faqs", { id: crypto.randomUUID(), ...row });
  go("/admin/faqs");
}

export async function deleteFaqAction(id: string) {
  await getDb({ admin: true }).remove("faqs", { id });
}

export async function answerInquiryAction(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  const answer = String(fd.get("answer") ?? "").trim();
  const now = new Date().toISOString();
  await getDb({ admin: true }).update("inquiries", { id }, answer
    ? { answer_html: toHtml(answer.slice(0, 10000)), status: "answered", answered_at: now, updated_at: now }
    : { answer_html: "", status: "waiting", answered_at: null, updated_at: now });
  go(`/admin/inquiries/${id}?saved=1`);
}
