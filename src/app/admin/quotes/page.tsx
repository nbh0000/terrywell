import Link from "next/link";
import { getDb } from "@/lib/db";
import { dt, Empty, PageTitle, Table } from "../ui";

export const metadata = { title: "견적문의" };
const QUOTE_STATUS = { new: "새 문의", in_progress: "처리중", done: "완료" } as const;

export default async function AdminQuotes() {
  const quotes = await getDb({ admin: true }).select("quote_requests", { order: [{ column: "created_at", ascending: false }] });
  return (
    <>
      <PageTitle title="견적문의" />
      {quotes.length === 0 ? (
        <Empty>견적문의가 없습니다.</Empty>
      ) : (
        <Table head={["접수일시", "회사 / 이름", "연락처", "제품", "수량", "희망 납기", "상태"]}>
          {quotes.map((q) => (
            <tr key={q.id} className="hover:bg-cloud/40">
              <td className="whitespace-nowrap px-4 py-2.5 text-muted">{dt(q.created_at)}</td>
              <td className="px-4 py-2.5"><Link href={`/admin/quotes/${q.id}`} className="font-medium underline">{q.company ? `${q.company} / ` : ""}{q.name}</Link></td>
              <td className="px-4 py-2.5">{q.phone}</td>
              <td className="px-4 py-2.5">{q.product || "-"}</td>
              <td className="px-4 py-2.5">{q.quantity || "-"}</td>
              <td className="px-4 py-2.5">{q.due_date || "-"}</td>
              <td className={`px-4 py-2.5 ${q.status === "new" ? "font-medium text-alert" : ""}`}>{QUOTE_STATUS[q.status]}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
