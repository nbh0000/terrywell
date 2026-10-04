"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { putFile, removeFiles } from "@/lib/storage";

const MAX_UPLOAD = 50 * 1024 * 1024;
const ALLOWED = ["pdf", "ai", "eps"];

export async function toggleWishlistAction(productId: string): Promise<{ ok: boolean; wished?: boolean; needLogin?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, needLogin: true };
  const db = getDb();
  const existing = await db.get("wishlists", { user_id: user.id, product_id: productId });
  if (existing) await db.remove("wishlists", { user_id: user.id, product_id: productId });
  else await db.insert("wishlists", { user_id: user.id, product_id: productId });
  revalidatePath("/mypage/wishlist");
  return { ok: true, wished: !existing };
}

export type UploadResult =
  | { ok: true; upload: { id: string; fileName: string; fileSize: number } }
  | { ok: false; error: string; needLogin?: boolean };

/** PDF·AI·EPS 디자인 파일 업로드 (필수 동의 2개) */
export async function uploadDesignFileAction(fd: FormData): Promise<UploadResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "파일을 올리려면 로그인이 필요합니다.", needLogin: true };
  if (fd.get("agree1") !== "on" || fd.get("agree2") !== "on") return { ok: false, error: "필수 항목에 모두 동의해 주세요." };
  const productId = String(fd.get("productId") ?? "");
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "파일을 선택해 주세요." };
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED.includes(ext)) return { ok: false, error: "PDF, AI, EPS 파일만 올릴 수 있습니다." };
  if (file.size > MAX_UPLOAD) return { ok: false, error: "50MB 이하 파일만 올릴 수 있습니다." };
  const db = getDb();
  if (!(await db.get("products", { id: productId }))) return { ok: false, error: "제품을 찾을 수 없습니다." };

  const id = randomUUID();
  const path = `${user.id}/${id}.${ext}`;
  await putFile("uploads", path, Buffer.from(await file.arrayBuffer()), ext === "pdf" ? "application/pdf" : "application/postscript");
  await db.insert("design_uploads", {
    id,
    user_id: user.id,
    product_id: productId,
    file_name: file.name.slice(0, 200),
    file_size: file.size,
    storage_path: path,
    agreed_at: new Date().toISOString(),
  });
  return { ok: true, upload: { id, fileName: file.name, fileSize: file.size } };
}

export async function deleteDesignFileAction(uploadId: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const db = getDb();
  const up = await db.get("design_uploads", { id: uploadId });
  if (!up || up.user_id !== user.id) return { ok: false };
  // 장바구니·주문에 쓰인 파일은 지우지 않는다
  const used = (await db.count("cart_items", { upload_id: uploadId })) + (await db.count("order_items", { upload_id: uploadId }));
  if (!used) {
    await removeFiles("uploads", [up.storage_path]);
    await db.remove("design_uploads", { id: uploadId });
  }
  return { ok: true };
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
  const qty = Math.floor(Number(input.quantity));
  if (!(qty >= 1 && qty <= 100000)) return { ok: false, error: "수량을 확인해 주세요." };
  const db = getDb();
  if (!(await db.get("products", { id: input.productId }))) return { ok: false, error: "제품을 찾을 수 없습니다." };
  if (input.designId) {
    const d = await db.get("designs", { id: input.designId });
    if (!d || d.user_id !== user.id) return { ok: false, error: "디자인을 찾을 수 없습니다." };
  } else if (input.uploadId) {
    const u = await db.get("design_uploads", { id: input.uploadId });
    if (!u || u.user_id !== user.id) return { ok: false, error: "업로드한 파일을 찾을 수 없습니다." };
  } else return { ok: false, error: "디자인을 먼저 완료해 주세요." };

  const row = await db.insert("cart_items", {
    user_id: user.id,
    product_id: input.productId,
    color_id: input.colorId,
    design_id: input.designId,
    upload_id: input.designId ? null : input.uploadId,
    quantity: qty,
  });
  revalidatePath("/cart");
  return { ok: true, cartItemId: row.id };
}
