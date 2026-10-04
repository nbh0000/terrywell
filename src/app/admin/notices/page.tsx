import Link from "next/link";
import { getDb } from "@/lib/db";
import { btnCls, dt, Empty, PageTitle, Table } from "../ui";
import { deleteNoticeAction } from "./actions";

export const metadata = { title: "공지사항" };

export default async function AdminNotices() {
  const notices = await getDb({ admin: true }).select("notices", { order: [{ column: "created_at", ascending: false }] });
  return (
    <>
      <PageTitle title="공지사항">
        <Link href="/admin/notices/new" className={btnCls}>글쓰기</Link>
      </PageTitle>
      {notices.length === 0 ? (
        <Empty>공지사항이 없습니다.</Empty>
      ) : (
        <Table head={["제목", "고정", "작성일", ""]}>
          {notices.map((n) => (
            <tr key={n.id}>
              <td className="px-4 py-2.5"><Link href={`/admin/notices/${n.id}`} className="underline">{n.title}</Link></td>
              <td className="px-4 py-2.5">{n.is_pinned ? "고정" : "-"}</td>
              <td className="px-4 py-2.5 text-muted">{dt(n.created_at)}</td>
              <td className="px-4 py-2.5 text-right">
                <form action={deleteNoticeAction.bind(null, n.id)}><button className="text-[12.5px] text-muted underline">삭제</button></form>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
