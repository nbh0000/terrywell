"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { ImageRef, LabeledValue } from "@/lib/db/types";

export interface ProductPayload {
  id?: string;
  slug: string;
  name_en: string;
  name_ko: string;
  category_slugs: string[];
  is_visible: boolean;
  sort_order: number;
  images: ImageRef[];
  specs: LabeledValue[];
  spec_note: string;
  towel_size: string;
  detail_html: string;
  detail_images: ImageRef[];
  notice_html: string;
  guide_html: string;
  shipping_info: LabeledValue[];
  base_price: number;
  vat_included: boolean;
  allow_editor: boolean;
  allow_upload: boolean;
  label_width_mm: number;
  label_height_mm: number;
  label_bleed_mm: number;
  label_safe_mm: number;
  label_corner_mm: number;
  label_pages: number;
  allow_pages: boolean;
  colors: { id?: string; name: string; swatch: string; images: ImageRef[]; mockup_url: string | null; label_x: number; label_y: number; label_w: number; label_rotate: number }[];
  tiers: { min_qty: number; unit_price: number }[];
  files: { kind: "guide" | "template"; name: string; url: string }[];
}

const num = (v: unknown, min = 0) => Math.max(min, Number(v) || 0);

export async function saveProductAction(p: ProductPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  await requireAdmin();
  const db = getDb({ admin: true });
  const slug = p.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!slug || !p.name_ko.trim() || !p.name_en.trim()) return { ok: false, error: "주소(slug), 영문명, 한글명을 입력해 주세요." };
  const dup = await db.get("products", { slug });
  if (dup && dup.id !== p.id) return { ok: false, error: "같은 주소(slug)를 쓰는 제품이 있습니다." };
  if (!(p.label_width_mm > 0 && p.label_height_mm > 0)) return { ok: false, error: "라벨 재단 사이즈를 입력해 주세요." };

  const row = {
    slug,
    name_en: p.name_en.trim(),
    name_ko: p.name_ko.trim(),
    category_slugs: p.category_slugs,
    is_visible: p.is_visible,
    sort_order: num(p.sort_order),
    images: p.images.filter((i) => i.url),
    specs: p.specs.filter((s) => s.label.trim()),
    spec_note: p.spec_note,
    towel_size: p.towel_size,
    detail_html: p.detail_html,
    detail_images: p.detail_images.filter((i) => i.url),
    notice_html: p.notice_html,
    guide_html: p.guide_html,
    shipping_info: p.shipping_info.filter((s) => s.label.trim()),
    base_price: num(p.base_price),
    vat_included: p.vat_included,
    allow_editor: p.allow_editor,
    allow_upload: p.allow_upload,
    label_width_mm: num(p.label_width_mm),
    label_height_mm: num(p.label_height_mm),
    label_bleed_mm: num(p.label_bleed_mm),
    label_safe_mm: num(p.label_safe_mm),
    label_corner_mm: num(p.label_corner_mm),
    label_pages: num(p.label_pages, 1),
    allow_pages: p.allow_pages,
    updated_at: new Date().toISOString(),
  };
  let id = p.id;
  if (id && (await db.get("products", { id }))) await db.update("products", { id }, row);
  else id = (await db.insert("products", { id: randomUUID(), ...row })).id;

  // 색상: 남은 것은 갱신, 없어진 것은 삭제 (주문·장바구니는 color_name 을 따로 들고 있다)
  const existing = await db.select("product_colors", { where: { product_id: id } });
  const keep = new Set<string>();
  for (const [i, c] of p.colors.entries()) {
    if (!c.name.trim()) continue;
    const data = { product_id: id, name: c.name.trim(), swatch: c.swatch, images: c.images.filter((x) => x.url), mockup_url: c.mockup_url || null, label_x: num(c.label_x), label_y: num(c.label_y), label_w: num(c.label_w), label_rotate: Number(c.label_rotate) || 0, sort_order: i };
    if (c.id && existing.some((e) => e.id === c.id)) {
      await db.update("product_colors", { id: c.id }, data);
      keep.add(c.id);
    } else keep.add((await db.insert("product_colors", { id: randomUUID(), ...data })).id);
  }
  for (const e of existing) if (!keep.has(e.id)) await db.remove("product_colors", { id: e.id });

  await db.remove("product_price_tiers", { product_id: id });
  for (const t of p.tiers.filter((t) => t.min_qty > 0 && t.unit_price > 0)) await db.insert("product_price_tiers", { id: randomUUID(), product_id: id, min_qty: Math.floor(t.min_qty), unit_price: Math.floor(t.unit_price) });

  await db.remove("product_files", { product_id: id });
  for (const f of p.files.filter((f) => f.url)) await db.insert("product_files", { id: randomUUID(), product_id: id, kind: f.kind, name: f.name, url: f.url });

  revalidatePath("/products", "layout");
  revalidatePath("/admin/products");
  return { ok: true, id };
}

export async function deleteProductAction(id: string) {
  await requireAdmin();
  const db = getDb({ admin: true });
  // 주문 이력이 있는 제품은 지우지 않고 숨긴다
  if (await db.count("order_items", { product_id: id })) await db.update("products", { id }, { is_visible: false });
  else {
    for (const t of ["product_colors", "product_price_tiers", "product_files", "wishlists", "cart_items"] as const) await db.remove(t, { product_id: id });
    await db.remove("products", { id });
  }
  revalidatePath("/admin/products");
  revalidatePath("/products", "layout");
}

export async function saveCategoryAction(fd: FormData) {
  await requireAdmin();
  const db = getDb({ admin: true });
  const id = String(fd.get("id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  const slug = String(fd.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const sort = Number(fd.get("sort_order")) || 0;
  if (!name || !slug) return;
  if (id) await db.update("categories", { id }, { name, slug, sort_order: sort });
  else if (!(await db.get("categories", { slug }))) await db.insert("categories", { id: randomUUID(), name, slug, sort_order: sort });
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin();
  await getDb({ admin: true }).remove("categories", { id });
  revalidatePath("/admin/products");
  revalidatePath("/products");
}
