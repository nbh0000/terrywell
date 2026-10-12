// 로컬 모드 DB(.data/db.json)에 2026-10 고객 수정 요청을 반영한다. 여러 번 실행해도 결과가 같다.
// 실행: npx tsx scripts/migrate-local-2026-10.ts
// Supabase 는 supabase/migrations/0002_feedback_2026_10.sql 을 적용한 뒤 관리자 화면에서 같은 값을 넣는다.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildFaqs, buildSeed } from "../src/lib/db/seed";

const file = path.join(process.cwd(), ".data", "db.json");
const db = JSON.parse(readFileSync(file, "utf8"));
const seed = buildSeed();
const fresh = seed.products[0];

const product = db.products.find((p: { slug: string }) => p.slug === fresh.slug);
if (!product) throw new Error(`${fresh.slug} 제품이 없습니다`);

// 제품: 이름·라벨 크기·수량 단위·상세 이미지·안내 문구 (id·가격·노출 등 관리자가 바꾼 값은 그대로)
Object.assign(product, {
  name_ko: fresh.name_ko,
  specs: fresh.specs,
  detail_images: fresh.detail_images,
  notice_html: fresh.notice_html,
  guide_html: fresh.guide_html,
  allow_upload: false,
  label_width_mm: fresh.label_width_mm,
  label_height_mm: fresh.label_height_mm,
  label_bleed_mm: fresh.label_bleed_mm,
  label_safe_mm: fresh.label_safe_mm,
  qty_step: fresh.qty_step,
  released_at: product.released_at ?? new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// 색상: 새 풀샷·라벨 위치 + 혼합 옵션. 기존 색상 id 는 장바구니·디자인이 가리키므로 유지한다
const colors = db.product_colors.filter((c: { product_id: string }) => c.product_id === product.id);
for (const s of seed.product_colors) {
  const row = { ...s, product_id: product.id };
  const old = colors.find((c: { name: string }) => c.name === s.name);
  if (old) Object.assign(old, { ...row, id: old.id });
  else db.product_colors.push(row);
}

// 단가표 화면 제거: 구간 단가 대신 기본 단가만 남긴다
db.product_price_tiers = db.product_price_tiers.filter((t: { product_id: string; min_qty: number }) => t.product_id !== product.id || t.min_qty === 1);

db.faqs ??= [];
if (!db.faqs.length) db.faqs = buildFaqs(new Date().toISOString());
db.inquiries ??= [];

writeFileSync(file + ".tmp", JSON.stringify(db, null, 2), "utf8");
writeFileSync(file, readFileSync(file + ".tmp"));
console.log("로컬 DB 반영 완료:", product.name_ko, "/ 색상", db.product_colors.filter((c: { product_id: string }) => c.product_id === product.id).length, "개 / FAQ", db.faqs.length, "개");
