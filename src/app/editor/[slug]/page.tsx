import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Editor } from "@/components/editor/Editor";
import type { LabelSpec } from "@/lib/editor/types";

export const metadata: Metadata = { title: "라벨 편집", robots: { index: false } };

// 라벨 에디터. 비로그인도 편집 가능, 저장·AI 는 로그인 필요.
export default async function EditorPage({ params, searchParams }: PageProps<"/editor/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const db = getDb();
  const product = await db.get("products", { slug, is_visible: true });
  if (!product || !product.allow_editor) notFound();

  const [colors, templates, stickers, user] = await Promise.all([
    db.select("product_colors", { where: { product_id: product.id }, order: [{ column: "sort_order" }] }),
    db.select("templates", { where: { is_visible: true }, order: [{ column: "sort_order" }] }),
    db.select("stickers", { order: [{ column: "sort_order" }] }),
    getCurrentUser(),
  ]);

  // 기존 디자인 불러오기 (본인 것만)
  let design = null;
  if (typeof sp.design === "string" && user) {
    const d = await db.get("designs", { id: sp.design });
    if (d && d.user_id === user.id && d.product_id === product.id) design = { id: d.id, name: d.name, doc: d.canvas_json, colorId: d.color_id };
  }

  const colorId = (typeof sp.color === "string" && colors.some((c) => c.id === sp.color) ? sp.color : null) ?? design?.colorId ?? colors[0]?.id ?? null;

  const label: LabelSpec = {
    widthMm: Number(product.label_width_mm),
    heightMm: Number(product.label_height_mm),
    bleedMm: Number(product.label_bleed_mm),
    safeMm: Number(product.label_safe_mm),
    cornerMm: Number(product.label_corner_mm),
    pages: product.label_pages,
    allowPages: product.allow_pages,
  };

  return (
    <Editor
      product={{ id: product.id, slug: product.slug, nameKo: product.name_ko }}
      label={label}
      colors={colors.map((c) => ({
        id: c.id,
        name: c.name,
        swatch: c.swatch,
        mockup: { url: c.mockup_url, x: Number(c.label_x), y: Number(c.label_y), w: Number(c.label_w), rotate: Number(c.label_rotate) },
      }))}
      initialColorId={colorId}
      templates={templates.filter((t) => !t.product_id || t.product_id === product.id).map((t) => ({ id: t.id, name: t.name, category: t.category, doc: t.canvas_json }))}
      stickers={stickers.map((s) => ({ id: s.id, name: s.name, category: s.category, url: s.url }))}
      loggedIn={!!user}
      design={design}
    />
  );
}
