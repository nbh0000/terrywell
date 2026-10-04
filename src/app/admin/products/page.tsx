import Link from "next/link";
import { getDb } from "@/lib/db";
import { won } from "@/lib/pricing";
import { btnCls, Card, inputCls, PageTitle, Table } from "../ui";
import { deleteCategoryAction, deleteProductAction, saveCategoryAction } from "./actions";

export const metadata = { title: "제품 관리" };

export default async function AdminProducts() {
  const db = getDb({ admin: true });
  const [products, categories] = await Promise.all([
    db.select("products", { order: [{ column: "sort_order" }] }),
    db.select("categories", { order: [{ column: "sort_order" }] }),
  ]);
  return (
    <>
      <PageTitle title="제품 관리">
        <Link href="/admin/products/new" className={btnCls}>제품 등록</Link>
      </PageTitle>
      <Table head={["사진", "제품", "카테고리", "기본 단가", "노출", "순서", ""]}>
        {products.map((p) => (
          <tr key={p.id}>
            <td className="px-4 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.images[0]?.url && <img src={p.images[0].url} alt="" className="size-12 object-cover" />}
            </td>
            <td className="px-4 py-2">
              <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">{p.name_ko}</Link>
              <p className="text-[12px] text-muted">{p.name_en} · /{p.slug}</p>
            </td>
            <td className="px-4 py-2 text-muted">{p.category_slugs.join(", ").toUpperCase()}</td>
            <td className="px-4 py-2">{won(p.base_price)}</td>
            <td className="px-4 py-2">{p.is_visible ? "노출" : <span className="text-muted">숨김</span>}</td>
            <td className="px-4 py-2">{p.sort_order}</td>
            <td className="px-4 py-2 text-right">
              <form action={deleteProductAction.bind(null, p.id)}>
                <button className="text-[12.5px] text-muted underline" title="주문 이력이 있으면 숨김 처리됩니다">삭제</button>
              </form>
            </td>
          </tr>
        ))}
      </Table>

      <Card title="카테고리 (제품 목록 탭)" className="mt-8">
        <p className="mb-3 text-[12.5px] text-muted">제품 목록 탭은 첫 번째 카테고리 · ALL · 나머지 순서로 보입니다.</p>
        <ul className="space-y-2">
          {categories.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2">
              <form action={saveCategoryAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={c.id} />
                <input name="name" defaultValue={c.name} className={`${inputCls} w-32!`} aria-label="이름" />
                <input name="slug" defaultValue={c.slug} className={`${inputCls} w-32!`} aria-label="코드" />
                <input name="sort_order" type="number" defaultValue={c.sort_order} className={`${inputCls} w-20!`} aria-label="순서" />
                <button className="text-[13px] underline">저장</button>
              </form>
              <form action={deleteCategoryAction.bind(null, c.id)}>
                <button className="text-[13px] text-muted underline">삭제</button>
              </form>
            </li>
          ))}
          <li>
            <form action={saveCategoryAction} className="flex flex-wrap items-center gap-2">
              <input name="name" placeholder="이름 (예: GIFT)" className={`${inputCls} w-32!`} />
              <input name="slug" placeholder="코드 (예: gift)" className={`${inputCls} w-32!`} />
              <input name="sort_order" type="number" placeholder="순서" className={`${inputCls} w-20!`} />
              <button className={btnCls}>추가</button>
            </form>
          </li>
        </ul>
      </Card>
    </>
  );
}
