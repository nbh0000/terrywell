"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";

const SETTINGS = ["company", "shipping"];
const CONTENTS = ["home", "about", "customLabel", "editorGuide", "pdfConsent"];

export async function saveSiteAction(key: string, value: unknown): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const table = SETTINGS.includes(key) ? "site_settings" : CONTENTS.includes(key) ? "site_contents" : null;
  if (!table) return { ok: false, error: "알 수 없는 항목입니다." };
  if (JSON.stringify(value).length > 200_000) return { ok: false, error: "내용이 너무 깁니다." };
  await getDb({ admin: true }).upsert(table, { key, value, updated_at: new Date().toISOString() }, ["key"]);
  revalidatePath("/", "layout");
  return { ok: true };
}
