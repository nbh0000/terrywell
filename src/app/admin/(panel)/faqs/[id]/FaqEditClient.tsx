"use client";

import Link from "next/link";
import { getDb } from "@/lib/db";
import { Loading, NotFound, usePageData, useRouteId } from "@/lib/page";
import { btnCls, Card, inputCls, Label, PageTitle, textareaCls } from "../../ui";
import { saveFaqAction } from "../../support/actions";

export function FaqEditClient() {
  const id = useRouteId();
  const { data, loading } = usePageData(
    async () => {
      const db = getDb({ admin: true });
      const [f, all] = await Promise.all([id === "new" ? null : db.get("faqs", { id: id! }), db.select("faqs", { order: [{ column: "sort_order" }] })]);
      return { f, all };
    },
    [id],
    !!id,
  );
  if (loading || !id || !data) return <Loading />;
  const { f, all } = data;
  if (id !== "new" && !f) return <NotFound title="질문을 찾을 수 없습니다." />;
  const cats = Array.from(new Set(all.map((x) => x.category)));
  return (
    <>
      <PageTitle title={f ? "질문 수정" : "질문 추가"}>
        <Link href="/admin/faqs" className="text-[13px] text-muted underline">목록</Link>
      </PageTitle>
      <Card>
        <form action={saveFaqAction} className="space-y-4">
          <input type="hidden" name="id" value={f?.id ?? ""} />
          <div className="grid gap-4 md:grid-cols-[220px_120px]">
            <Label label="분류" hint={cats.length ? `지금 분류: ${cats.join(", ")}` : undefined}>
              <input name="category" list="faq-cats" defaultValue={f?.category ?? cats[0] ?? ""} required className={inputCls} />
              <datalist id="faq-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
            </Label>
            <Label label="순서"><input type="number" name="sort_order" defaultValue={f?.sort_order ?? all.length} className={inputCls} /></Label>
          </div>
          <Label label="질문"><input name="question" defaultValue={f?.question} required className={inputCls} /></Label>
          <Label label="답변" hint="그냥 쓰면 빈 줄 기준으로 문단이 나뉩니다. HTML 도 쓸 수 있습니다.">
            <textarea name="answer" rows={8} defaultValue={f?.answer_html} className={textareaCls} />
          </Label>
          <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" name="is_visible" defaultChecked={f?.is_visible ?? true} className="accent-point" />사이트에 노출</label>
          <button className={btnCls}>저장</button>
        </form>
      </Card>
    </>
  );
}
