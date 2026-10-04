"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function duplicateDesignAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const db = getDb();
  const d = await db.get("designs", { id });
  if (!d || d.user_id !== user.id) return;
  // 파일은 원본과 같은 것을 가리키고, 수정해서 저장하면 새 파일이 만들어진다
  await db.insert("designs", {
    id: randomUUID(),
    user_id: d.user_id,
    product_id: d.product_id,
    color_id: d.color_id,
    name: `${d.name} 복사본`,
    canvas_json: d.canvas_json,
    thumbnail_url: d.thumbnail_url,
    print_png_url: d.print_png_url,
    print_pdf_url: d.print_pdf_url,
    print_cmyk_url: d.print_cmyk_url,
    updated_at: new Date().toISOString(),
  });
  revalidatePath("/mypage/designs");
}

export async function deleteDesignAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const db = getDb();
  const d = await db.get("designs", { id });
  if (!d || d.user_id !== user.id) return;
  // 주문에 쓰인 디자인은 인쇄 파일이 필요해서 남겨 둔다
  if (await db.count("order_items", { design_id: id })) return;
  await db.remove("cart_items", { design_id: id });
  await db.remove("designs", { id });
  revalidatePath("/mypage/designs");
}
