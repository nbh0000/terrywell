"use client";

import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Loading, NotFound, getQuery, usePageData, useRouteId } from "@/lib/page";
import { getContent } from "@/lib/site";
import { ProductDetail } from "./ProductDetail";

// reference/02 "제품 선택했을 때 나오는 창" 시안
export function ProductClient() {
  const slug = useRouteId();
  const { data, loading } = usePageData(
    async () => {
      const sp = getQuery();
      const db = getDb();
      const product = await db.get("products", { slug: slug!, is_visible: true });
      if (!product) return null;

      const [colors, tiers, user, mix] = await Promise.all([
        db.select("product_colors", { where: { product_id: product.id }, order: [{ column: "sort_order" }] }),
        db.select("product_price_tiers", { where: { product_id: product.id }, order: [{ column: "min_qty" }] }),
        getCurrentUser(),
        getContent("mixNotice"),
      ]);

      let wished = false;
      let design: { id: string; thumbnail: string | null; colorId: string | null } | null = null;
      if (user) {
        wished = !!(await db.get("wishlists", { user_id: user.id, product_id: product.id }));
        // 에디터에서 막 저장하고 돌아온 디자인, 없으면 이 제품의 가장 최근 디자인
        const wantedId = sp.get("design");
        const wanted = wantedId ? await db.get("designs", { id: wantedId }) : null;
        const d =
          wanted && wanted.product_id === product.id
            ? wanted
            : (await db.select("designs", { where: { user_id: user.id, product_id: product.id }, order: [{ column: "updated_at", ascending: false }], limit: 1 }))[0];
        if (d) design = { id: d.id, thumbnail: d.thumbnail_url, colorId: d.color_id };
      }
      const colorParam = sp.get("color");
      return { product, colors, tiers, user, mix, wished, design, colorParam };
    },
    [slug],
    !!slug,
  );
  if (loading || !slug) return <Loading className="min-h-[70vh]" />;
  if (!data) return <NotFound title="제품을 찾을 수 없습니다." />;
  const { product, colors, tiers, user, mix, wished, design, colorParam } = data;
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
        qtyStep: product.qty_step ?? 1,
      }}
      colors={colors.map((c) => ({ id: c.id, name: c.name, swatch: c.swatch, images: c.images, isMix: !!c.is_mix }))}
      initialColorId={(colorParam && colors.some((c) => c.id === colorParam) ? colorParam : null) ?? design?.colorId ?? colors[0]?.id ?? null}
      tiers={tiers.map((t) => ({ min_qty: t.min_qty, unit_price: t.unit_price }))}
      mixNotice={mix.lines}
      loggedIn={!!user}
      wished={wished}
      design={design}
    />
  );
}
