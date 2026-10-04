/**
 * Supabase 에 초기 데이터(카테고리·제품·색상·단가표·템플릿·스티커·공지)를 넣는다.
 * 사용: .env.local 에 Supabase 키를 넣고 `npm run seed:supabase`
 * 이미 제품이 있으면 아무것도 하지 않는다.
 */
import { createClient } from "@supabase/supabase-js";
import { buildSeed } from "../src/lib/db/seed";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다 (.env.local).");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { count } = await sb.from("products").select("*", { count: "exact", head: true });
  if (count) {
    console.log(`이미 제품 ${count}개가 있어 건너뜁니다.`);
    return;
  }
  const seed = buildSeed();
  // 외래키 순서대로
  const order = ["categories", "products", "product_colors", "product_price_tiers", "templates", "stickers", "notices"] as const;
  for (const table of order) {
    const rows = seed[table] as object[];
    if (!rows.length) continue;
    const { error } = await sb.from(table).insert(rows);
    if (error) throw new Error(`${table}: ${error.message}`);
    console.log(`${table}: ${rows.length}건`);
  }
  console.log("완료. 관리자 지정은 README 의 SQL 을 실행하세요.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
