"use client";

import { getDb } from "@/lib/db";
import { Loading, usePageData } from "@/lib/page";
import { Empty, inputCls, PageTitle } from "../ui";
import { StickerUploader } from "./StickerUploader";

async function addSticker(url: string, name: string, category: string) {
  const db = getDb({ admin: true });
  const max = (await db.select("stickers")).reduce((m, s) => Math.max(m, s.sort_order), 0);
  await db.insert("stickers", { id: crypto.randomUUID(), name: name.slice(0, 60) || "스티커", category: category.slice(0, 30) || "기본", url, sort_order: max + 1 });
}

async function updateSticker(fd: FormData) {
  await getDb({ admin: true }).update("stickers", { id: String(fd.get("id")) }, { name: String(fd.get("name") ?? ""), category: String(fd.get("category") ?? "기본"), sort_order: Number(fd.get("sort_order")) || 0 });
}

async function deleteSticker(id: string) {
  await getDb({ admin: true }).remove("stickers", { id });
}

export function StickersClient() {
  const { data: stickers, reload } = usePageData(() => getDb({ admin: true }).select("stickers", { order: [{ column: "sort_order" }] }));
  return (
    <>
      <PageTitle title="스티커 · 요소">
        <StickerUploader onAdd={async (url, name, category) => { await addSticker(url, name, category); reload(); }} />
      </PageTitle>
      <p className="mb-4 text-[13px] text-muted">SVG 또는 투명 배경 PNG 를 올리면 에디터 [스티커] 메뉴에 나옵니다.</p>
      {!stickers ? (
        <Loading />
      ) : stickers.length === 0 ? (
        <Empty>등록된 스티커가 없습니다.</Empty>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
          {stickers.map((s) => (
            <li key={s.id} className="rounded-[10px] border border-line bg-white p-3">
              <div className="grid aspect-square place-items-center bg-[repeating-conic-gradient(#f2f2f2_0_25%,#fff_0_50%)] bg-[length:14px_14px] p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt={s.name} className="max-h-full max-w-full" />
              </div>
              <form action={async (fd) => { await updateSticker(fd); reload(); }} className="mt-2 space-y-1.5 text-[12.5px]">
                <input type="hidden" name="id" value={s.id} />
                <input name="name" defaultValue={s.name} className={`${inputCls} h-8!`} aria-label="이름" />
                <div className="flex gap-1.5">
                  <input name="category" defaultValue={s.category} className={`${inputCls} h-8!`} aria-label="분류" />
                  <input name="sort_order" type="number" defaultValue={s.sort_order} className={`${inputCls} h-8! w-16!`} aria-label="순서" />
                </div>
                <div className="flex justify-between">
                  <button className="underline">저장</button>
                  <button type="button" className="text-muted underline" onClick={async () => { if (confirm("삭제할까요?")) { await deleteSticker(s.id); reload(); } }}>삭제</button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
