import Link from "next/link";
import { getDb } from "@/lib/db";
import { INQUIRY_STATUS_LABEL } from "@/lib/inquiry";
import { dt, Empty, PageTitle, Table } from "../ui";

export const metadata = { title: "1:1 문의" };

export default async function AdminInquiries({ searchParams }: PageProps<"/admin/inquiries">) {
  const sp = await searchParams;
  const status = sp.status === "waiting" || sp.status === "answered" ? sp.status : null;
  const db = getDb({ admin: true });
  const [rows, profiles] = await Promise.all([
    db.select("inquiries", { where: status ? { status } : undefined, order: [{ column: "created_at", ascending: false }] }),
    db.select("profiles"),
  ]);
  const who = (id: string) => {
    const p = profiles.find((x) => x.id === id);
    return p ? p.name || p.email : "-";
  };
  const tab = (v: string | null, label: string) => (
    <Link href={v ? `/admin/inquiries?status=${v}` : "/admin/inquiries"} className={`rounded-[6px] px-3 py-1.5 text-[13px] ${status === v ? "bg-ink text-white" : "bg-white text-ink/70"}`}>{label}</Link>
  );
  return (
    <>
      <PageTitle title="1:1 문의" />
      <div className="mb-4 flex gap-1.5">{tab(null, "전체")}{tab("waiting", "답변 대기")}{tab("answered", "답변 완료")}</div>
      {rows.length === 0 ? (
        <Empty>문의가 없습니다.</Empty>
      ) : (
        <Table head={["상태", "유형", "제목", "회원", "주문번호", "작성일"]}>
          {rows.map((q) => (
            <tr key={q.id}>
              <td className="whitespace-nowrap px-4 py-2.5"><span className={q.status === "waiting" ? "font-medium text-alert" : "text-muted"}>{INQUIRY_STATUS_LABEL[q.status]}</span></td>
              <td className="whitespace-nowrap px-4 py-2.5">{q.type}</td>
              <td className="px-4 py-2.5"><Link href={`/admin/inquiries/${q.id}`} className="underline">{q.title}</Link></td>
              <td className="whitespace-nowrap px-4 py-2.5">{who(q.user_id)}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted">{q.order_no || "-"}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted">{dt(q.created_at)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
