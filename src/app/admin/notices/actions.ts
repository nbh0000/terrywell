// 공지사항 저장·삭제 (브라우저 → PHP /api/db, 관리자만)

import { getDb } from "@/lib/db";
import { go } from "@/lib/page";
import { toHtml } from "../support/actions";

export async function saveNoticeAction(fd: FormData) {
  const db = getDb({ admin: true });
  const id = String(fd.get("id") ?? "");
  const title = String(fd.get("title") ?? "").trim().slice(0, 200);
  if (!title) return;
  const row = { title, body_html: toHtml(String(fd.get("body") ?? "")), is_pinned: fd.get("is_pinned") === "on", updated_at: new Date().toISOString() };
  if (id) await db.update("notices", { id }, row);
  else await db.insert("notices", { id: crypto.randomUUID(), ...row });
  go("/admin/notices");
}

export async function deleteNoticeAction(id: string) {
  await getDb({ admin: true }).remove("notices", { id });
}
