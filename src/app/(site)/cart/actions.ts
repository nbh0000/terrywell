// 장바구니 수량·삭제 (브라우저 → PHP /api/db. 본인 줄만 고칠 수 있게 서버가 막는다)

import { getDb } from "@/lib/db";
import { normalizeQty } from "@/lib/pricing";

export async function updateCartQtyAction(itemId: string, quantity: number) {
  if (!(Number(quantity) >= 1 && Number(quantity) <= 100000)) return { ok: false };
  const db = getDb();
  const it = await db.get("cart_items", { id: itemId });
  if (!it) return { ok: false };
  const product = await db.get("products", { id: it.product_id });
  const q = normalizeQty(quantity, product?.qty_step);
  await db.update("cart_items", { id: itemId }, { quantity: q });
  return { ok: true };
}

export async function removeCartItemsAction(itemIds: string[]) {
  const db = getDb();
  for (const id of itemIds) await db.remove("cart_items", { id });
  return { ok: true };
}
