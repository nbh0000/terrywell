// 제품 상세: 찜 토글·장바구니 담기 (브라우저 → PHP /api/db. 본인 행만 서버가 허용한다)

import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { normalizeQty } from "@/lib/pricing";

export async function toggleWishlistAction(productId: string): Promise<{ ok: boolean; wished?: boolean; needLogin?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, needLogin: true };
  const db = getDb();
  const existing = await db.get("wishlists", { user_id: user.id, product_id: productId });
  if (existing) await db.remove("wishlists", { user_id: user.id, product_id: productId });
  else await db.insert("wishlists", { user_id: user.id, product_id: productId });
  return { ok: true, wished: !existing };
}

/** 장바구니 담기: 에디터 디자인 또는 업로드 파일 중 하나 */
export async function addToCartAction(input: {
  productId: string;
  colorId: string | null;
  designId: string | null;
  uploadId: string | null;
  quantity: number;
}): Promise<{ ok: boolean; error?: string; needLogin?: boolean; cartItemId?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, needLogin: true, error: "로그인이 필요합니다." };
  if (!(Number(input.quantity) >= 1 && Number(input.quantity) <= 100000)) return { ok: false, error: "수량을 확인해 주세요." };
  const db = getDb();
  const product = await db.get("products", { id: input.productId });
  if (!product) return { ok: false, error: "제품을 찾을 수 없습니다." };
  const qty = normalizeQty(input.quantity, product.qty_step);
  if (input.designId) {
    if (!(await db.get("designs", { id: input.designId }))) return { ok: false, error: "디자인을 찾을 수 없습니다." };
  } else if (input.uploadId) {
    if (!(await db.get("design_uploads", { id: input.uploadId }))) return { ok: false, error: "업로드한 파일을 찾을 수 없습니다." };
  } else return { ok: false, error: "디자인을 먼저 완료해 주세요." };

  try {
    const row = await db.insert("cart_items", {
      user_id: user.id,
      product_id: input.productId,
      color_id: input.colorId,
      design_id: input.designId,
      upload_id: input.designId ? null : input.uploadId,
      quantity: qty,
    });
    return { ok: true, cartItemId: row.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "담지 못했습니다." };
  }
}
