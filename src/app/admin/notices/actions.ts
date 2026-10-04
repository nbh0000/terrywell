"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";

// 본문: HTML 이 아니면 줄바꿈을 문단으로 바꾼다
function toHtml(body: string) {
  if (/<\w+[^>]*>/.test(body)) return body;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  return body
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export async function saveNoticeAction(fd: FormData) {
  await requireAdmin();
  const db = getDb({ admin: true });
  const id = String(fd.get("id") ?? "");
  const title = String(fd.get("title") ?? "").trim().slice(0, 200);
  if (!title) return;
  const row = { title, body_html: toHtml(String(fd.get("body") ?? "")), is_pinned: fd.get("is_pinned") === "on", updated_at: new Date().toISOString() };
  if (id) await db.update("notices", { id }, row);
  else await db.insert("notices", { id: randomUUID(), ...row });
  revalidatePath("/notices", "layout");
  revalidatePath("/admin/notices");
  redirect("/admin/notices");
}

export async function deleteNoticeAction(id: string) {
  await requireAdmin();
  await getDb({ admin: true }).remove("notices", { id });
  revalidatePath("/notices", "layout");
  revalidatePath("/admin/notices");
}
