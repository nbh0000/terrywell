"use client";

import Link from "next/link";
import { getDb } from "@/lib/db";
import { Loading, usePageData } from "@/lib/page";
import { btnCls, dt, Empty, PageTitle, Table } from "../ui";
import { deleteNoticeAction } from "./actions";

export function NoticesAdminClient() {
  const { data: notices, reload } = usePageData(() => getDb({ admin: true }).select("notices", { order: [{ column: "created_at", ascending: false }] }));
  return (
    <>
      <PageTitle title="공지사항">
        <Link href="/admin/notices/new" className={btnCls}>글쓰기</Link>
      </PageTitle>
      {!notices ? (
        <Loading />
      ) : notices.length === 0 ? (
        <Empty>공지사항이 없습니다.</Empty>
      ) : (
        <Table head={["제목", "고정", "작성일", ""]}>
          {notices.map((n) => (
            <tr key={n.id}>
              <td className="px-4 py-2.5"><Link href={`/admin/notices/${n.id}`} className="underline">{n.title}</Link></td>
              <td className="px-4 py-2.5">{n.is_pinned ? "고정" : "-"}</td>
              <td className="px-4 py-2.5 text-muted">{dt(n.created_at)}</td>
              <td className="px-4 py-2.5 text-right">
                <button type="button" className="text-[12.5px] text-muted underline" onClick={async () => { if (confirm("삭제할까요?")) { await deleteNoticeAction(n.id); reload(); } }}>삭제</button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
