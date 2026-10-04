import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ProductDetail } from "./ProductDetail";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getDb().get("products", { slug, is_visible: true });
  return { title: p ? p.name_ko : "제품" };
}

// reference/02 "제품 선택했을 때 나오는 창" 시안
export default async function ProductPage({ params, searchParams }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const db = getDb();
  const product = await db.get("products", { slug, is_visible: true });
  if (!product) notFound();

  const [colors, tiers, files, user] = await Promise.all([
    db.select("product_colors", { where: { product_id: product.id }, order: [{ column: "sort_order" }] }),
    db.select("product_price_tiers", { where: { product_id: product.id }, order: [{ column: "min_qty" }] }),
    db.select("product_files", { where: { product_id: product.id } }),
    getCurrentUser(),
  ]);

  let wished = false;
  let design: { id: string; thumbnail: string | null; colorId: string | null } | null = null;
  if (user) {
    wished = !!(await db.get("wishlists", { user_id: user.id, product_id: product.id }));
    // 에디터에서 막 저장하고 돌아온 디자인, 없으면 이 제품의 가장 최근 디자인
    const wanted = typeof sp.design === "string" ? await db.get("designs", { id: sp.design }) : null;
    const d =
      wanted && wanted.user_id === user.id && wanted.product_id === product.id
        ? wanted
        : (await db.select("designs", { where: { user_id: user.id, product_id: product.id }, order: [{ column: "updated_at", ascending: false }], limit: 1 }))[0];
    if (d) design = { id: d.id, thumbnail: d.thumbnail_url, colorId: d.color_id };
  }

  const colorParam = typeof sp.color === "string" ? sp.color : null;
  return (
    <ProductDetail
      product={{
        id: product.id,
        slug: product.slug,
        nameEn: product.name_en,
        nameKo: product.name_ko,
        images: product.images,
        specs: product.specs,
        specNote: product.spec_note,
        towelSize: product.towel_size,
        labelW: Number(product.label_width_mm),
        labelH: Number(product.label_height_mm),
        shipping: product.shipping_info,
        basePrice: product.base_price,
        vatIncluded: product.vat_included,
        allowEditor: product.allow_editor,
        allowUpload: product.allow_upload,
        detailHtml: product.detail_html,
        detailImages: product.detail_images,
        noticeHtml: product.notice_html,
        guideHtml: product.guide_html,
      }}
      colors={colors.map((c) => ({ id: c.id, name: c.name, swatch: c.swatch, images: c.images }))}
      initialColorId={(colorParam && colors.some((c) => c.id === colorParam) ? colorParam : null) ?? design?.colorId ?? colors[0]?.id ?? null}
      tiers={tiers.map((t) => ({ min_qty: t.min_qty, unit_price: t.unit_price }))}
      files={{
        guide: files.find((f) => f.kind === "guide")?.url ?? null,
        template: files.find((f) => f.kind === "template")?.url ?? null,
      }}
      loggedIn={!!user}
      wished={wished}
      design={design}
    />
  );
}
