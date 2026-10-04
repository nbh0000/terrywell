import Link from "next/link";
import { getDb } from "@/lib/db";
import { Card, Empty, inputCls, PageTitle } from "../ui";
import { deleteTemplateAction, updateTemplateMetaAction } from "./actions";
import { TemplateThumb } from "./TemplateThumb";

export const metadata = { title: "템플릿" };

export default async function AdminTemplates() {
  const db = getDb({ admin: true });
  const [templates, products] = await Promise.all([
    db.select("templates", { order: [{ column: "sort_order" }] }),
    db.select("products", { order: [{ column: "sort_order" }] }),
  ]);
  const editorProducts = products.filter((p) => p.allow_editor);
  return (
    <>
      <PageTitle title="디자인 템플릿" />
      <Card title="새 템플릿 만들기" className="mb-6">
        <p className="mb-3 text-[13px] text-muted">제품을 고르면 그 제품의 라벨 크기로 에디터가 열립니다. 디자인한 뒤 [편집종료] → [템플릿으로 저장]을 누르세요. 다른 크기의 라벨에서도 비율에 맞춰 적용됩니다.</p>
        <div className="flex flex-wrap gap-2">
          {editorProducts.map((p) => (
            <Link key={p.id} href={`/editor/${p.slug}?template=new`} className="rounded-[6px] border border-line bg-white px-3 py-2 text-[13.5px] hover:border-ink/40">
              {p.name_ko} ({Number(p.label_width_mm)}×{Number(p.label_height_mm)}mm)
            </Link>
          ))}
        </div>
      </Card>
      {templates.length === 0 ? (
        <Empty>등록된 템플릿이 없습니다.</Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => {
            const p = products.find((x) => x.id === t.product_id) ?? editorProducts[0];
            return (
              <li key={t.id} className="rounded-[10px] border border-line bg-white p-4">
                <TemplateThumb doc={t.canvas_json} />
                <form action={updateTemplateMetaAction} className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                  <input type="hidden" name="id" value={t.id} />
                  <input name="name" defaultValue={t.name} className={inputCls} aria-label="이름" />
                  <input name="category" defaultValue={t.category} className={inputCls} aria-label="분류" />
                  <label className="flex items-center gap-1.5"><input type="checkbox" name="is_visible" defaultChecked={t.is_visible} className="accent-point" />노출</label>
                  <input name="sort_order" type="number" defaultValue={t.sort_order} className={inputCls} aria-label="순서" />
                  <button className="col-span-2 h-9 rounded-[6px] bg-ink text-white">저장</button>
                </form>
                <div className="mt-2 flex gap-3 text-[13px]">
                  {p && <Link href={`/editor/${p.slug}?template=${t.id}`} className="text-point underline">에디터에서 수정</Link>}
                  <form action={deleteTemplateAction.bind(null, t.id)}><button className="text-muted underline">삭제</button></form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
