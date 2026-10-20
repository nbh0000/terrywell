// 저장한 디자인 복제·삭제 (브라우저 → PHP /api/db. 본인 디자인만, 주문에 쓰인 디자인은 서버가 삭제를 막는다)

import { getDb } from "@/lib/db";

export async function duplicateDesignAction(id: string) {
  const db = getDb();
  const d = await db.get("designs", { id });
  if (!d) return;
  // 파일은 원본과 같은 것을 가리키고, 수정해서 저장하면 새 파일이 만들어진다
  await db.insert("designs", {
    id: crypto.randomUUID(),
    user_id: d.user_id,
    product_id: d.product_id,
    color_id: d.color_id,
    name: `${d.name} 복사본`,
    canvas_json: d.canvas_json,
    thumbnail_url: d.thumbnail_url,
    print_png_url: d.print_png_url,
    print_pdf_url: d.print_pdf_url,
    print_cmyk_url: d.print_cmyk_url,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteDesignAction(id: string) {
  const db = getDb();
  await db.remove("cart_items", { design_id: id });
  await db.remove("designs", { id });
}
