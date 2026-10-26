// 템플릿 저장·수정·삭제 (브라우저 → PHP /api/db, 관리자만 서버가 허용)

import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { DesignDoc } from "@/lib/editor/types";

/** 에디터 템플릿 모드에서 호출 */
export async function saveTemplateAction(input: { id?: string; name: string; category: string; productId: string | null; doc: DesignDoc }): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return { ok: false, error: "관리자만 템플릿을 저장할 수 있습니다." };
  const db = getDb({ admin: true });
  const row = { name: input.name.trim().slice(0, 60) || "템플릿", category: input.category.trim().slice(0, 30) || "기본", product_id: input.productId, canvas_json: input.doc };
  try {
    if (input.id && (await db.get("templates", { id: input.id }))) {
      await db.update("templates", { id: input.id }, row);
      return { ok: true, id: input.id };
    }
    const max = (await db.select("templates")).reduce((m, t) => Math.max(m, t.sort_order), 0);
    const t = await db.insert("templates", { id: crypto.randomUUID(), ...row, thumbnail_url: null, is_visible: true, sort_order: max + 1 });
    return { ok: true, id: t.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "저장하지 못했습니다." };
  }
}

export async function updateTemplateMetaAction(fd: FormData) {
  const id = String(fd.get("id"));
  await getDb({ admin: true }).update("templates", { id }, {
    name: String(fd.get("name") ?? "").slice(0, 60),
    category: String(fd.get("category") ?? "").slice(0, 30) || "기본",
    sort_order: Number(fd.get("sort_order")) || 0,
    is_visible: fd.get("is_visible") === "on",
  });
}

export async function deleteTemplateAction(id: string) {
  await getDb({ admin: true }).remove("templates", { id });
}
