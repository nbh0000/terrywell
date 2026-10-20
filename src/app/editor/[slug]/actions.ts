// 에디터 저장(PHP /api/designs/save 가 인쇄 PNG·PDF·CMYK 를 만든다)·장바구니 담기

import { apiForm } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { DesignDoc } from "@/lib/editor/types";
import { normalizeQty } from "@/lib/pricing";

export type SaveResult = { ok: true; designId: string } | { ok: false; error: string; needLogin?: boolean };

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(head)?.[1] ?? "application/octet-stream";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * 디자인 저장: JSON + 썸네일 + 인쇄용 PNG(300dpi). 서버가 PDF(실제 mm 크기)·CMYK TIFF 를 함께 만든다.
 */
export async function saveDesignAction(input: {
  designId?: string;
  productId: string;
  colorId: string | null;
  name: string;
  doc: DesignDoc;
  thumbnail: string; // data URL
  printPng: string; // data URL (첫 페이지)
}): Promise<SaveResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "저장하려면 로그인이 필요합니다.", needLogin: true };
  const fd = new FormData();
  if (input.designId) fd.set("designId", input.designId);
  fd.set("productId", input.productId);
  fd.set("colorId", input.colorId ?? "");
  fd.set("name", input.name);
  fd.set("doc", JSON.stringify(input.doc));
  fd.set("thumbnail", dataUrlToBlob(input.thumbnail), "thumb.png");
  fd.set("printPng", dataUrlToBlob(input.printPng), "print.png");
  try {
    const r = await apiForm<{ ok: boolean; designId?: string; error?: string }>("designs/save", fd);
    return r.ok && r.designId ? { ok: true, designId: r.designId } : { ok: false, error: r.error ?? "저장하지 못했습니다." };
  } catch (e) {
    const err = e as { unauthorized?: boolean; message?: string };
    return { ok: false, error: err.message ?? "저장하지 못했습니다.", needLogin: !!err.unauthorized };
  }
}

export async function addDesignToCartAction(designId: string): Promise<{ ok: boolean; error?: string; cartItemId?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };
  const db = getDb();
  const design = await db.get("designs", { id: designId });
  if (!design) return { ok: false, error: "디자인을 찾을 수 없습니다." };
  // 처음 담을 때는 최소 수량(수량 단위 1개)
  const product = await db.get("products", { id: design.product_id });
  const quantity = normalizeQty(1, product?.qty_step);
  const existing = await db.get("cart_items", { user_id: user.id, design_id: designId });
  if (existing) {
    await db.update("cart_items", { id: existing.id }, { quantity: normalizeQty(existing.quantity + quantity, product?.qty_step) });
    return { ok: true, cartItemId: existing.id };
  }
  const row = await db.insert("cart_items", {
    user_id: user.id,
    product_id: design.product_id,
    color_id: design.color_id,
    design_id: designId,
    upload_id: null,
    quantity,
  });
  return { ok: true, cartItemId: row.id };
}
