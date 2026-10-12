"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { normalizeQty } from "@/lib/pricing";

export async function updateCartQtyAction(itemId: string, quantity: number) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  if (!(Number(quantity) >= 1 && Number(quantity) <= 100000)) return { ok: false };
  const db = getDb();
  const it = await db.get("cart_items", { id: itemId });
  if (!it || it.user_id !== user.id) return { ok: false };
  const product = await db.get("products", { id: it.product_id });
  const q = normalizeQty(quantity, product?.qty_step);
  await db.update("cart_items", { id: itemId }, { quantity: q });
  revalidatePath("/cart");
  return { ok: true };
}

export async function removeCartItemsAction(itemIds: string[]) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const db = getDb();
  for (const id of itemIds) {
    const it = await db.get("cart_items", { id });
    if (it && it.user_id === user.id) await db.remove("cart_items", { id });
  }
  revalidatePath("/cart");
  return { ok: true };
}
