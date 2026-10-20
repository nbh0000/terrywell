// 사이트 설정·콘텐츠 저장 (브라우저 → PHP /api/db, 관리자만)

import { getDb } from "@/lib/db";

const SETTINGS = ["company", "shipping", "products"];
const CONTENTS = ["home", "about", "customLabel", "editorGuide", "pdfConsent", "legal", "mixNotice", "fonts"];

export async function saveSiteAction(key: string, value: unknown): Promise<{ ok: boolean; error?: string }> {
  const table = SETTINGS.includes(key) ? "site_settings" : CONTENTS.includes(key) ? "site_contents" : null;
  if (!table) return { ok: false, error: "알 수 없는 항목입니다." };
  if (JSON.stringify(value).length > 200_000) return { ok: false, error: "내용이 너무 깁니다." };
  try {
    await getDb({ admin: true }).upsert(table, { key, value, updated_at: new Date().toISOString() }, ["key"]);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "저장하지 못했습니다." };
  }
}
