"use client";

import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getContent } from "@/lib/site";
import { Editor } from "@/components/editor/Editor";
import { FONTS } from "@/components/editor/constants";
import type { LabelSpec } from "@/lib/editor/types";
import { Loading, NotFound, getQuery, usePageData, useRouteId } from "@/lib/page";

// 라벨 에디터. 비로그인도 편집 가능, 저장·AI 는 로그인 필요.
// 템플릿은 다른 라벨 크기로 만든 것도 비율에 맞춰 적용되므로 제품과 관계없이 모두 보여 준다.
export function EditorClient() {
  const slug = useRouteId();
  const { data, loading } = usePageData(
    async () => {
      const sp = getQuery();
      const db = getDb();
      const product = await db.get("products", { slug: slug!, is_visible: true });
      if (!product || !product.allow_editor) return null;
      const user = await getCurrentUser();
      const isAdmin = user?.role === "admin";

      const [colors, templates, stickers, guide, mix, fonts] = await Promise.all([
        db.select("product_colors", { where: { product_id: product.id }, order: [{ column: "sort_order" }] }),
        getDb({ admin: isAdmin }).select("templates", { where: isAdmin ? {} : { is_visible: true }, order: [{ column: "sort_order" }] }),
        db.select("stickers", { order: [{ column: "sort_order" }] }),
        getContent("editorGuide"),
        getContent("mixNotice"),
        getContent("fonts"),
      ]);

      // 기존 디자인 불러오기 (본인 것만 서버가 돌려준다)
      let design: { id: string; name: string; doc: unknown; colorId: string | null } | null = null;
      const designId = sp.get("design");
      if (designId && user) {
        const d = await db.get("designs", { id: designId });
        if (d && d.product_id === product.id) design = { id: d.id, name: d.name, doc: d.canvas_json, colorId: d.color_id };
      }

      // 관리자 템플릿 모드 (?template=new | 템플릿 id)
      let templateMode: { id: string | null; name: string; category: string } | null = null;
      const tp = sp.get("template");
      if (tp && isAdmin) {
        const t = tp === "new" ? null : templates.find((x) => x.id === tp) ?? (await getDb({ admin: true }).get("templates", { id: tp }));
        templateMode = { id: t?.id ?? null, name: t?.name ?? "", category: t?.category ?? "기본" };
        if (t) design = { id: "", name: t.name, doc: t.canvas_json, colorId: null };
      }

      const colorQ = sp.get("color");
      const colorId = (colorQ && colors.some((c) => c.id === colorQ) ? colorQ : null) ?? design?.colorId ?? colors[0]?.id ?? null;
      return { product, colors, templates: templates.filter((t) => t.is_visible || isAdmin), stickers, user, guide, mix, fonts, design, templateMode, colorId };
    },
    [slug],
    !!slug,
  );
  if (loading || !slug) return <Loading className="min-h-screen" />;
  if (!data) return <NotFound title="편집할 수 없는 제품입니다." />;
  const { product, colors, templates, stickers, user, guide, mix, fonts, design, templateMode, colorId } = data;

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
        isMix: !!c.is_mix,
        mockup: { url: c.mockup_url, x: Number(c.label_x), y: Number(c.label_y), w: Number(c.label_w), rotate: Number(c.label_rotate) },
      }))}
      initialColorId={colorId}
      templates={templates.map((t) => ({ id: t.id, name: t.name, category: t.category, doc: t.canvas_json }))}
      stickers={stickers.map((s) => ({ id: s.id, name: s.name, category: s.category, url: s.url }))}
      loggedIn={!!user}
      design={design}
      templateMode={templateMode}
      guideNotes={guide.notes}
      mixNotice={mix.lines}
      fonts={[...FONTS, ...fonts.custom.filter((f) => f.url && f.family)]}
    />
  );
}
