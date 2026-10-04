"use server";

import { randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { DesignDoc } from "@/lib/editor/types";
import { workSize } from "@/lib/editor/types";
import { dataUrlToBuffer, putFile } from "@/lib/storage";

export type SaveResult = { ok: true; designId: string } | { ok: false; error: string; needLogin?: boolean };

const MM_TO_PT = 72 / 25.4;
const MAX_PNG_BYTES = 30 * 1024 * 1024;

/**
 * 디자인 저장: JSON + 썸네일 + 인쇄용 PNG(300dpi) + PDF(실제 mm 크기) + CMYK TIFF.
 * 인쇄 파일은 가이드 선 없이 작업 사이즈 전체로 만든다.
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

  const db = getDb();
  const product = await db.get("products", { id: input.productId });
  if (!product) return { ok: false, error: "제품을 찾을 수 없습니다." };

  let designId = input.designId;
  if (designId) {
    const existing = await db.get("designs", { id: designId });
    if (!existing || existing.user_id !== user.id) designId = undefined; // 남의 디자인이면 새로 저장
  }
  designId ??= randomUUID();

  const png = dataUrlToBuffer(input.printPng).buffer;
  if (png.length > MAX_PNG_BYTES) return { ok: false, error: "디자인 파일이 너무 큽니다." };
  const thumb = dataUrlToBuffer(input.thumbnail).buffer;

  // 300dpi 정보를 넣은 PNG
  const printPng = await sharp(png).withMetadata({ density: 300 }).png().toBuffer();
  // CMYK 변환본 (인쇄소 전달용 TIFF)
  // withMetadata 를 쓰면 sRGB 로 되돌아가므로 CMYK ICC 프로필로 변환하고 해상도는 tiff 옵션(px/mm)으로 넣는다
  const cmyk = await sharp(png)
    .flatten({ background: "#ffffff" })
    .withIccProfile("cmyk")
    .tiff({ compression: "lzw", xres: 300 / 25.4, yres: 300 / 25.4, resolutionUnit: "inch" })
    .toBuffer();
  // PDF: 작업 사이즈(mm) 그대로
  const { w, h } = workSize(input.doc.label);
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([w * MM_TO_PT, h * MM_TO_PT]);
  const img = await pdf.embedPng(printPng);
  page.drawImage(img, { x: 0, y: 0, width: w * MM_TO_PT, height: h * MM_TO_PT });
  pdf.setTitle(`${product.name_ko} 라벨`);
  const pdfBytes = Buffer.from(await pdf.save());

  const base = `${user.id}/${designId}`;
  const stamp = Date.now(); // 캐시 무효화용
  const [thumbUrl, pngUrl, pdfUrl, cmykUrl] = await Promise.all([
    putFile("designs", `${base}/thumb-${stamp}.png`, thumb, "image/png"),
    putFile("designs", `${base}/print-${stamp}.png`, printPng, "image/png"),
    putFile("designs", `${base}/print-${stamp}.pdf`, pdfBytes, "application/pdf"),
    putFile("designs", `${base}/print-cmyk-${stamp}.tif`, cmyk, "image/tiff"),
  ]);

  const row = {
    user_id: user.id,
    product_id: product.id,
    color_id: input.colorId,
    name: input.name.slice(0, 60) || "내 디자인",
    canvas_json: input.doc,
    thumbnail_url: thumbUrl,
    print_png_url: pngUrl,
    print_pdf_url: pdfUrl,
    print_cmyk_url: cmykUrl,
  };
  if (await db.get("designs", { id: designId })) await db.update("designs", { id: designId }, row);
  else await db.insert("designs", { id: designId, ...row });
  return { ok: true, designId };
}

export async function addDesignToCartAction(designId: string, quantity = 1): Promise<{ ok: boolean; error?: string; cartItemId?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };
  const db = getDb();
  const design = await db.get("designs", { id: designId });
  if (!design || design.user_id !== user.id) return { ok: false, error: "디자인을 찾을 수 없습니다." };
  const existing = await db.get("cart_items", { user_id: user.id, design_id: designId });
  if (existing) {
    await db.update("cart_items", { id: existing.id }, { quantity: existing.quantity + quantity });
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
