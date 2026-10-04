import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { deleteDesignAction, duplicateDesignAction } from "./actions";

export const metadata: Metadata = { title: "저장한 디자인" };

export default async function DesignsPage() {
  const user = await requireUser("/mypage/designs");
  const db = getDb();
  const designs = await db.select("designs", { where: { user_id: user.id }, order: [{ column: "updated_at", ascending: false }] });
  if (!designs.length)
    return (
      <p className="py-16 text-center text-[14px] text-muted">
        저장한 디자인이 없습니다. <Link href="/products" className="text-ink underline">라벨 디자인 시작하기</Link>
      </p>
    );
  const products = new Map((await db.select("products")).map((p) => [p.id, p]));
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {designs.map((d) => {
        const p = products.get(d.product_id);
        return (
          <li key={d.id} className="border border-line bg-paper">
            <div className="grid aspect-[65/45] place-items-center bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {d.thumbnail_url && <img src={d.thumbnail_url} alt="" className="h-full w-full object-contain" />}
            </div>
            <div className="p-3 text-[13px]">
              <p className="truncate font-medium">{p?.name_ko ?? "제품"}</p>
              <p className="text-[12px] text-muted">{new Date(d.updated_at).toLocaleDateString("ko-KR")}</p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {p && (
                  <Link href={`/editor/${p.slug}?design=${d.id}${d.color_id ? `&color=${d.color_id}` : ""}`} className="text-point underline">
                    불러오기
                  </Link>
                )}
                <form action={duplicateDesignAction.bind(null, d.id)}>
                  <button className="text-muted underline">복제</button>
                </form>
                <form action={deleteDesignAction.bind(null, d.id)}>
                  <button className="text-muted underline">삭제</button>
                </form>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
