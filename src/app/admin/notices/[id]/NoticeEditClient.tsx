"use client";

import Link from "next/link";
import { getDb } from "@/lib/db";
import { Loading, NotFound, usePageData, useRouteId } from "@/lib/page";
import { btnCls, Card, inputCls, Label, PageTitle, textareaCls } from "../../ui";
import { saveNoticeAction } from "../actions";

export function NoticeEditClient() {
  const id = useRouteId();
  const { data, loading } = usePageData(async () => ({ n: id === "new" ? null : await getDb({ admin: true }).get("notices", { id: id! }) }), [id], !!id);
  if (loading || !id || !data) return <Loading />;
  const n = data.n;
  if (id !== "new" && !n) return <NotFound title="공지사항을 찾을 수 없습니다." />;
  return (
    <>
      <PageTitle title={n ? "공지사항 수정" : "공지사항 작성"}>
        <Link href="/admin/notices" className="text-[13px] text-muted underline">목록</Link>
      </PageTitle>
      <Card>
        <form action={saveNoticeAction} className="space-y-4">
          <input type="hidden" name="id" value={n?.id ?? ""} />
          <Label label="제목"><input name="title" defaultValue={n?.title} required className={inputCls} /></Label>
          <Label label="본문" hint="그냥 쓰면 빈 줄 기준으로 문단이 나뉩니다. HTML 도 쓸 수 있습니다.">
            <textarea name="body" rows={14} defaultValue={n?.body_html} className={textareaCls} />
          </Label>
          <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" name="is_pinned" defaultChecked={n?.is_pinned} className="accent-point" />목록 맨 위에 고정</label>
          <button className={btnCls}>저장</button>
        </form>
      </Card>
    </>
  );
}
