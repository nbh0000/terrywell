"use client";

import Link from "next/link";
import { getDb } from "@/lib/db";
import { INQUIRY_STATUS_LABEL } from "@/lib/inquiry";
import { Loading, NotFound, getQuery, usePageData, useRouteId } from "@/lib/page";
import { btnCls, Card, dt, Label, PageTitle, textareaCls } from "../../ui";
import { answerInquiryAction } from "../../support/actions";

export function InquiryAdminClient() {
  const id = useRouteId();
  const { data, loading } = usePageData(
    async () => {
      const db = getDb({ admin: true });
      const q = await db.get("inquiries", { id: id! });
      if (!q) return null;
      const [member, order] = await Promise.all([db.get("profiles", { id: q.user_id }), q.order_no ? db.get("orders", { order_no: q.order_no }) : null]);
      return { q, member, order, saved: !!getQuery().get("saved") };
    },
    [id],
    !!id,
  );
  if (loading || !id) return <Loading />;
  if (!data) return <NotFound title="문의를 찾을 수 없습니다." />;
  const { q, member, order, saved } = data;
  return (
    <>
      <PageTitle title="1:1 문의">
        <Link href="/admin/inquiries" className="text-[13px] text-muted underline">목록</Link>
      </PageTitle>
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Card>
          <p className="text-[12.5px] text-muted">{q.type} · {dt(q.created_at)} · {INQUIRY_STATUS_LABEL[q.status]}</p>
          <h2 className="mt-1 text-[17px] font-semibold">{q.title}</h2>
          <div className="mt-4 whitespace-pre-line text-[14px] leading-[1.8]">{q.body}</div>
          {q.attachments.length > 0 && (
            <ul className="mt-4 space-y-1 text-[13px]">
              {q.attachments.map((a) => (
                <li key={a.path}><a href={`/api/files/uploads/${a.path}?download=1`} download={a.name} className="underline">{a.name}</a> <span className="text-muted">({(a.size / 1024 / 1024).toFixed(1)}MB)</span></li>
              ))}
            </ul>
          )}
          <form action={answerInquiryAction} className="mt-6 space-y-3 border-t border-line pt-5">
            <input type="hidden" name="id" value={q.id} />
            <Label label="답변" hint="저장하면 회원 화면에 '답변 완료'로 보입니다. 비우고 저장하면 다시 '답변 대기'가 됩니다.">
              <textarea name="answer" rows={9} defaultValue={q.answer_html} className={textareaCls} />
            </Label>
            <div className="flex items-center gap-3">
              <button className={btnCls}>답변 저장</button>
              {saved && <span className="text-[13px] text-muted">저장했습니다.</span>}
            </div>
          </form>
        </Card>
        <Card title="문의한 회원">
          <dl className="space-y-1.5 text-[13.5px]">
            <div className="flex gap-3"><dt className="w-16 text-muted">이름</dt><dd>{member?.name || "-"}</dd></div>
            <div className="flex gap-3"><dt className="w-16 text-muted">이메일</dt><dd className="break-all">{member?.email || "-"}</dd></div>
            <div className="flex gap-3"><dt className="w-16 text-muted">연락처</dt><dd>{member?.phone || "-"}</dd></div>
            <div className="flex gap-3"><dt className="w-16 text-muted">주문</dt><dd>{order ? <Link href={`/admin/orders/${order.id}`} className="underline">{order.order_no}</Link> : q.order_no || "-"}</dd></div>
          </dl>
        </Card>
      </div>
    </>
  );
}
