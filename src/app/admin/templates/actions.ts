"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { DesignDoc } from "@/lib/editor/types";

/** 에디터 템플릿 모드에서 호출 */
export async function saveTemplateAction(input: { id?: string; name: string; category: string; productId: string | null; doc: DesignDoc }): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return { ok: false, error: "관리자만 템플릿을 저장할 수 있습니다." };
  const db = getDb({ admin: true });
  const row = { name: input.name.trim().slice(0, 60) || "템플릿", category: input.category.trim().slice(0, 30) || "기본", product_id: input.productId, canvas_json: input.doc };
  if (input.id && (await db.get("templates", { id: input.id }))) {
    await db.update("templates", { id: input.id }, row);
    revalidatePath("/admin/templates");
    return { ok: true, id: input.id };
  }
  const max = (await db.select("templates")).reduce((m, t) => Math.max(m, t.sort_order), 0);
  const t = await db.insert("templates", { id: randomUUID(), ...row, thumbnail_url: null, is_visible: true, sort_order: max + 1 });
  revalidatePath("/admin/templates");
  return { ok: true, id: t.id };
}

export async function updateTemplateMetaAction(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  await getDb({ admin: true }).update("templates", { id }, {
    name: String(fd.get("name") ?? "").slice(0, 60),
    category: String(fd.get("category") ?? "").slice(0, 30) || "기본",
    sort_order: Number(fd.get("sort_order")) || 0,
    is_visible: fd.get("is_visible") === "on",
  });
  revalidatePath("/admin/templates");
}

export async function deleteTemplateAction(id: string) {
  await requireAdmin();
  await getDb({ admin: true }).remove("templates", { id });
  revalidatePath("/admin/templates");
}
