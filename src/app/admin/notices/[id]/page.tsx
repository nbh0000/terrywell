import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { btnCls, Card, inputCls, Label, PageTitle, textareaCls } from "../../ui";
import { saveNoticeAction } from "../actions";

export const metadata = { title: "공지사항 작성" };

export default async function EditNotice({ params }: PageProps<"/admin/notices/[id]">) {
  const { id } = await params;
  const n = id === "new" ? null : await getDb({ admin: true }).get("notices", { id });
  if (id !== "new" && !n) notFound();
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
