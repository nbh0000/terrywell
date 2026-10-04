import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { PageTitle } from "../../ui";
import { ProductForm } from "../ProductForm";
import type { ProductPayload } from "../actions";

export const metadata = { title: "제품 수정" };

export default async function EditProduct({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const db = getDb({ admin: true });
  const categories = await db.select("categories", { order: [{ column: "sort_order" }] });
  if (id === "new") {
    return (
      <>
        <PageTitle title="제품 등록" />
        <ProductForm categories={categories} initial={null} />
      </>
    );
  }
  const p = await db.get("products", { id });
  if (!p) notFound();
  const [colors, tiers, files] = await Promise.all([
    db.select("product_colors", { where: { product_id: id }, order: [{ column: "sort_order" }] }),
    db.select("product_price_tiers", { where: { product_id: id }, order: [{ column: "min_qty" }] }),
    db.select("product_files", { where: { product_id: id } }),
  ]);
  const initial: ProductPayload = {
    ...p,
    label_width_mm: Number(p.label_width_mm),
    label_height_mm: Number(p.label_height_mm),
    label_bleed_mm: Number(p.label_bleed_mm),
    label_safe_mm: Number(p.label_safe_mm),
    label_corner_mm: Number(p.label_corner_mm),
    colors: colors.map((c) => ({ id: c.id, name: c.name, swatch: c.swatch, images: c.images, mockup_url: c.mockup_url, label_x: Number(c.label_x), label_y: Number(c.label_y), label_w: Number(c.label_w), label_rotate: Number(c.label_rotate) })),
    tiers: tiers.map((t) => ({ min_qty: t.min_qty, unit_price: t.unit_price })),
    files: files.map((f) => ({ kind: f.kind, name: f.name, url: f.url })),
  };
  return (
    <>
      <PageTitle title={`제품 수정 · ${p.name_ko}`} />
      <ProductForm categories={categories} initial={initial} />
    </>
  );
}
