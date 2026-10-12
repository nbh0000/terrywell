import "server-only";
import { getDb } from "@/lib/db";
import { normalizeQty, shippingFee, splitVat, unitPriceFor } from "@/lib/pricing";
import { getSetting } from "@/lib/site";

export interface CartLine {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  productNameEn: string;
  colorId: string | null;
  colorName: string | null;
  designId: string | null;
  uploadId: string | null;
  thumbnail: string | null; // 디자인 썸네일 또는 제품 사진
  fileName: string | null; // PDF 업로드 파일명
  quantity: number;
  qtyStep: number; // 수량 단위 (5P 세트면 5)
  unitPrice: number;
  lineAmount: number;
  supply: number;
  vat: number;
  total: number;
}

/** 장바구니 줄과 금액 (모두 서버에서 다시 계산) */
export async function loadCart(userId: string, onlyIds?: string[]) {
  const db = getDb();
  let items = await db.select("cart_items", { where: { user_id: userId }, order: [{ column: "created_at" }] });
  if (onlyIds?.length) items = items.filter((i) => onlyIds.includes(i.id));
  const lines: CartLine[] = [];
  for (const it of items) {
    const product = await db.get("products", { id: it.product_id });
    if (!product) continue;
    const [color, design, upload, tiers] = await Promise.all([
      it.color_id ? db.get("product_colors", { id: it.color_id }) : null,
      it.design_id ? db.get("designs", { id: it.design_id }) : null,
      it.upload_id ? db.get("design_uploads", { id: it.upload_id }) : null,
      db.select("product_price_tiers", { where: { product_id: product.id } }),
    ]);
    // 수량 단위가 바뀌기 전에 담은 줄도 단위에 맞춰 계산한다
    const quantity = normalizeQty(it.quantity, product.qty_step);
    const unitPrice = unitPriceFor(quantity, tiers, product.base_price);
    const lineAmount = unitPrice * quantity;
    const v = splitVat(lineAmount, product.vat_included);
    lines.push({
      id: it.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name_ko,
      productNameEn: product.name_en,
      colorId: color?.id ?? null,
      colorName: color?.name ?? null,
      designId: design?.id ?? null,
      uploadId: upload?.id ?? null,
      thumbnail: design?.thumbnail_url ?? color?.images[1]?.url ?? product.images[0]?.url ?? null,
      fileName: upload?.file_name ?? null,
      quantity,
      qtyStep: Math.max(1, product.qty_step || 1),
      unitPrice,
      lineAmount,
      supply: v.supply,
      vat: v.vat,
      total: v.total,
    });
  }
  const itemsTotal = lines.reduce((s, l) => s + l.total, 0);
  const shipping = shippingFee(itemsTotal, await getSetting("shipping"));
  return {
    lines,
    supply: lines.reduce((s, l) => s + l.supply, 0),
    vat: lines.reduce((s, l) => s + l.vat, 0),
    itemsTotal,
    shipping,
    grandTotal: itemsTotal + shipping,
  };
}
