"use client";

import { getDb } from "@/lib/db";
import { Loading, NotFound, usePageData, useRouteId } from "@/lib/page";
import { PageTitle } from "../../ui";
import { ProductForm } from "../ProductForm";
import type { ProductPayload } from "../actions";

export function ProductEditClient() {
  const id = useRouteId();
  const { data, loading } = usePageData(
    async () => {
      const db = getDb({ admin: true });
      const categories = await db.select("categories", { order: [{ column: "sort_order" }] });
      if (id === "new") return { categories, initial: null as ProductPayload | null, name: "" };
      const p = await db.get("products", { id: id! });
      if (!p) return null;
      const [colors, tiers, files] = await Promise.all([
        db.select("product_colors", { where: { product_id: id! }, order: [{ column: "sort_order" }] }),
        db.select("product_price_tiers", { where: { product_id: id! }, order: [{ column: "min_qty" }] }),
        db.select("product_files", { where: { product_id: id! } }),
      ]);
      const initial: ProductPayload = {
        ...p,
        label_width_mm: Number(p.label_width_mm),
        label_height_mm: Number(p.label_height_mm),
        label_bleed_mm: Number(p.label_bleed_mm),
        label_safe_mm: Number(p.label_safe_mm),
        label_corner_mm: Number(p.label_corner_mm),
        qty_step: p.qty_step ?? 1,
        released_at: p.released_at ? p.released_at.slice(0, 10) : null,
        colors: colors.map((c) => ({ id: c.id, name: c.name, swatch: c.swatch, images: c.images, mockup_url: c.mockup_url, label_x: Number(c.label_x), label_y: Number(c.label_y), label_w: Number(c.label_w), label_rotate: Number(c.label_rotate), is_mix: !!c.is_mix })),
        tiers: tiers.map((t) => ({ min_qty: t.min_qty, unit_price: t.unit_price })),
        files: files.map((f) => ({ kind: f.kind, name: f.name, url: f.url })),
      };
      return { categories, initial, name: p.name_ko };
    },
    [id],
    !!id,
  );
  if (loading || !id) return <Loading />;
  if (!data) return <NotFound title="제품을 찾을 수 없습니다." />;
  return (
    <>
      <PageTitle title={data.initial ? `제품 수정 · ${data.name}` : "제품 등록"} />
      <ProductForm categories={data.categories} initial={data.initial} />
    </>
  );
}
