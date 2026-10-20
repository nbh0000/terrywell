"use client";

import Link from "next/link";
import { getDb } from "@/lib/db";
import { INQUIRY_STATUS_LABEL } from "@/lib/inquiry";
import { Loading, usePageData, useQuery } from "@/lib/page";
import { dt, Empty, PageTitle, Table } from "../ui";

export function InquiriesClient() {
  const q = useQuery();
  const s = q?.get("status");
  const status = s === "waiting" || s === "answered" ? s : null;
  const { data } = usePageData(
    async () => {
      const db = getDb({ admin: true });
      const [rows, profiles] = await Promise.all([
        db.select("inquiries", { where: status ? { status } : undefined, order: [{ column: "created_at", ascending: false }] }),
        db.select("profiles"),
      ]);
      return { rows, profiles };
    },
    [status],
    !!q,
  );
  const who = (id: string) => {
    const p = data?.profiles.find((x) => x.id === id);
    return p ? p.name || p.email : "-";
  };
  const tab = (v: string | null, label: string) => (
    <Link href={v ? `/admin/inquiries?status=${v}` : "/admin/inquiries"} className={`rounded-[6px] px-3 py-1.5 text-[13px] ${status === v ? "bg-ink text-white" : "bg-white text-ink/70"}`}>{label}</Link>
  );
  return (
    <>
      <PageTitle title="1:1 문의" />
      <div className="mb-4 flex gap-1.5">{tab(null, "전체")}{tab("waiting", "답변 대기")}{tab("answered", "답변 완료")}</div>
      {!data ? (
        <Loading />
      ) : data.rows.length === 0 ? (
        <Empty>문의가 없습니다.</Empty>
      ) : (
        <Table head={["상태", "유형", "제목", "회원", "주문번호", "작성일"]}>
          {data.rows.map((x) => (
            <tr key={x.id}>
              <td className="whitespace-nowrap px-4 py-2.5"><span className={x.status === "waiting" ? "font-medium text-alert" : "text-muted"}>{INQUIRY_STATUS_LABEL[x.status]}</span></td>
              <td className="whitespace-nowrap px-4 py-2.5">{x.type}</td>
              <td className="px-4 py-2.5"><Link href={`/admin/inquiries/${x.id}`} className="underline">{x.title}</Link></td>
              <td className="whitespace-nowrap px-4 py-2.5">{who(x.user_id)}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted">{x.order_no || "-"}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted">{dt(x.created_at)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
