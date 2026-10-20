"use client";

import Link from "next/link";
import { useState } from "react";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Loading, usePageData } from "@/lib/page";
import { deleteDesignAction, duplicateDesignAction } from "./actions";

export function DesignsClient() {
  const [err, setErr] = useState<string | null>(null);
  const { data, reload } = usePageData(async () => {
    const user = await requireUser("/mypage/designs");
    const db = getDb();
    const designs = await db.select("designs", { where: { user_id: user.id }, order: [{ column: "updated_at", ascending: false }] });
    const products = new Map((await db.select("products")).map((p) => [p.id, p]));
    return { designs, products };
  });
  if (!data) return <Loading />;
  const { designs, products } = data;
  if (!designs.length)
    return (
      <p className="py-16 text-center text-[14px] text-muted">
        저장한 디자인이 없습니다. <Link href="/products" className="text-ink underline">라벨 디자인 시작하기</Link>
      </p>
    );
  const run = async (fn: () => Promise<void>) => {
    try {
      setErr(null);
      await fn();
      reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "처리하지 못했습니다.");
    }
  };
  return (
    <>
      {err && <p role="alert" className="mb-4 text-[13px] text-red-600">{err}</p>}
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {designs.map((d) => {
          const p = products.get(d.product_id);
          return (
            <li key={d.id} className="border border-line bg-paper">
              <div className="grid aspect-[68/48] place-items-center bg-white">
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
                  <button type="button" className="text-muted underline" onClick={() => run(() => duplicateDesignAction(d.id))}>복제</button>
                  <button type="button" className="text-muted underline" onClick={() => run(() => deleteDesignAction(d.id))}>삭제</button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
