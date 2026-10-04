import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { btnCls, Card, dt, inputCls, PageTitle, textareaCls } from "../../ui";

export const metadata = { title: "견적문의 상세" };

async function updateQuote(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id"));
  const status = String(fd.get("status"));
  if (!["new", "in_progress", "done"].includes(status)) return;
  await getDb({ admin: true }).update("quote_requests", { id }, { status: status as "new", admin_memo: String(fd.get("admin_memo") ?? "").slice(0, 3000) });
  revalidatePath(`/admin/quotes/${id}`);
  revalidatePath("/admin/quotes");
}

export default async function AdminQuote({ params }: PageProps<"/admin/quotes/[id]">) {
  const { id } = await params;
  const q = await getDb({ admin: true }).get("quote_requests", { id });
  if (!q) notFound();
  const rows: [string, string][] = [
    ["회사", q.company],
    ["이름", q.name],
    ["연락처", q.phone],
    ["이메일", q.email],
    ["제품", q.product],
    ["예상 수량", q.quantity],
    ["희망 납기", q.due_date],
    ["접수일시", dt(q.created_at)],
  ];
  return (
    <>
      <PageTitle title={`견적문의 · ${q.name}`}>
        <Link href="/admin/quotes" className="text-[13px] text-muted underline">목록</Link>
      </PageTitle>
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card>
          <dl className="grid grid-cols-[90px_1fr] gap-y-2 text-[14px]">
            {rows.map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd>{v || "-"}</dd></div>
            ))}
          </dl>
          <h3 className="mt-6 text-[13px] text-muted">문의 내용</h3>
          <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed">{q.message || "-"}</p>
          {q.attachments.length > 0 && (
            <>
              <h3 className="mt-6 text-[13px] text-muted">첨부 파일</h3>
              <ul className="mt-1 space-y-1 text-[14px]">
                {q.attachments.map((a) => (
                  <li key={a.path}><a href={`/api/files/uploads/${a.path}`} download={a.name} className="underline">{a.name}</a> <span className="text-muted">({(a.size / 1024 / 1024).toFixed(1)}MB)</span></li>
                ))}
              </ul>
            </>
          )}
        </Card>
        <Card title="처리">
          <form action={updateQuote} className="space-y-3">
            <input type="hidden" name="id" value={q.id} />
            <select name="status" defaultValue={q.status} className={inputCls} aria-label="상태">
              <option value="new">새 문의</option>
              <option value="in_progress">처리중</option>
              <option value="done">완료</option>
            </select>
            <textarea name="admin_memo" rows={6} defaultValue={q.admin_memo} placeholder="관리자 메모" className={textareaCls} />
            <button className={`${btnCls} w-full`}>저장</button>
          </form>
        </Card>
      </div>
    </>
  );
}
