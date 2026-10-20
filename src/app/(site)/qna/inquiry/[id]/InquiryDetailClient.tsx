"use client";

import Link from "next/link";
import { Paperclip } from "lucide-react";
import { CenterShell } from "@/components/support/CenterShell";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { INQUIRY_STATUS_LABEL } from "@/lib/inquiry";
import { Loading, NotFound, usePageData, useRouteId } from "@/lib/page";

export function InquiryDetailClient() {
  const id = useRouteId();
  const { data: q, loading } = usePageData(
    async () => {
      const user = await requireUser(`/qna/inquiry/${id}`);
      // 본인 문의만 서버가 돌려준다 (관리자는 전체)
      return getDb({ admin: user.role === "admin" }).get("inquiries", { id: id! });
    },
    [id],
    !!id,
  );
  return (
    <CenterShell title="1:1 문의">
      {loading || !id ? (
        <Loading />
      ) : !q ? (
        <NotFound title="문의를 찾을 수 없습니다." />
      ) : (
        <>
          <article className="border-t border-ink/70">
            <header className="border-b border-line py-4">
              <p className="text-[12.5px] text-muted">
                {q.type}
                {q.order_no ? ` · 주문번호 ${q.order_no}` : ""} · {new Date(q.created_at).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })}
              </p>
              <h2 className="mt-1 text-[17px] font-medium">{q.title}</h2>
            </header>
            <div className="whitespace-pre-line py-5 text-[14.5px] leading-[1.8]">{q.body}</div>
            {q.attachments.length > 0 && (
              <ul className="mb-5 space-y-1 text-[13px]">
                {q.attachments.map((a) => (
                  <li key={a.path}>
                    <a href={`/api/files/uploads/${a.path}?download=1`} className="inline-flex items-center gap-1.5 underline" download={a.name}>
                      <Paperclip size={13} /> {a.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <section className={`rounded-[10px] p-5 ${q.status === "answered" ? "bg-point/[0.06]" : "bg-tile"}`}>
              <p className="mb-2 flex items-center gap-2 text-[13.5px] font-medium">
                <span className={`rounded-[4px] px-2 py-0.5 text-[12px] ${q.status === "answered" ? "bg-point text-white" : "bg-white text-muted"}`}>{INQUIRY_STATUS_LABEL[q.status]}</span>
                {q.answered_at && <span className="font-normal text-muted">{new Date(q.answered_at).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })}</span>}
              </p>
              {q.status === "answered" ? (
                <div className="prose-tw" dangerouslySetInnerHTML={{ __html: q.answer_html }} />
              ) : (
                <p className="text-[14px] text-muted">답변을 준비하고 있습니다. 운영시간 안에 순서대로 답변드립니다.</p>
              )}
            </section>
          </article>
          <div className="mt-6">
            <Link href="/qna/inquiry" className="inline-flex h-10 items-center rounded-[6px] border border-line px-4 text-[14px]">목록</Link>
          </div>
        </>
      )}
    </CenterShell>
  );
}
