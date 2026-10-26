"use client";

import Link from "next/link";
import { getDb } from "@/lib/db";
import { Loading, usePageData } from "@/lib/page";
import { btnCls, Empty, PageTitle, Table } from "../ui";
import { deleteFaqAction } from "../support/actions";

export function FaqsClient() {
  const { data: faqs, reload } = usePageData(() => getDb({ admin: true }).select("faqs", { order: [{ column: "sort_order" }] }));
  return (
    <>
      <PageTitle title="자주 묻는 질문">
        <Link href="/admin/faqs/new" className={btnCls}>질문 추가</Link>
      </PageTitle>
      <p className="-mt-3 mb-4 text-[13px] text-muted">Q&amp;A 화면과 1:1 문의 유형별 추천 질문에 나옵니다. 분류 이름이 같으면 같은 탭에 모입니다.</p>
      {!faqs ? (
        <Loading />
      ) : faqs.length === 0 ? (
        <Empty>등록된 질문이 없습니다.</Empty>
      ) : (
        <Table head={["순서", "분류", "질문", "노출", ""]}>
          {faqs.map((f) => (
            <tr key={f.id}>
              <td className="px-4 py-2.5 text-muted">{f.sort_order}</td>
              <td className="whitespace-nowrap px-4 py-2.5">{f.category}</td>
              <td className="px-4 py-2.5"><Link href={`/admin/faqs/${f.id}`} className="underline">{f.question}</Link></td>
              <td className="px-4 py-2.5">{f.is_visible ? "노출" : "숨김"}</td>
              <td className="px-4 py-2.5 text-right">
                <button type="button" className="text-[12.5px] text-muted underline" onClick={async () => { if (confirm("삭제할까요?")) { await deleteFaqAction(f.id); reload(); } }}>삭제</button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
