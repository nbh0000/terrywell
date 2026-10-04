import Link from "next/link";
import { getDb } from "@/lib/db";
import type { OrderStatus } from "@/lib/db/types";
import { STATUS_LABEL } from "@/lib/orders";
import { won } from "@/lib/pricing";
import { dt, Empty, inputCls, PageTitle, Pager, Table } from "../ui";

export const metadata = { title: "주문 관리" };
const PER = 20;

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? (sp.status as OrderStatus | "all") : "all";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const db = getDb({ admin: true });
  let orders = await db.select("orders", { order: [{ column: "created_at", ascending: false }] });
  if (status !== "all") orders = orders.filter((o) => o.status === status);
  else orders = orders.filter((o) => o.status !== "pending");
  if (q) orders = orders.filter((o) => o.order_no.includes(q) || String(o.recipient.name ?? "").includes(q) || String(o.recipient.phone ?? "").includes(q));
  const pages = Math.max(1, Math.ceil(orders.length / PER));
  const list = orders.slice((page - 1) * PER, page * PER);
  const statuses: (OrderStatus | "all")[] = ["all", "paid", "producing", "shipping", "done", "cancelled", "pending"];

  return (
    <>
      <PageTitle title="주문 관리" />
      <form className="mb-4 flex flex-wrap items-center gap-2">
        <select name="status" defaultValue={status} className={`${inputCls} w-36!`} aria-label="상태">
          {statuses.map((s) => <option key={s} value={s}>{s === "all" ? "전체 (결제대기 제외)" : STATUS_LABEL[s]}</option>)}
        </select>
        <input name="q" defaultValue={q} placeholder="주문번호 · 받는 분 · 연락처" className={`${inputCls} w-64!`} />
        <button className="h-10 rounded-[6px] bg-ink px-4 text-[14px] text-white">검색</button>
      </form>
      {list.length === 0 ? (
        <Empty>주문이 없습니다.</Empty>
      ) : (
        <Table head={["주문일시", "주문번호", "받는 분", "상품", "금액", "상태", "세금계산서"]}>
          {await Promise.all(
            list.map(async (o) => {
              const items = await db.select("order_items", { where: { order_id: o.id } });
              return (
                <tr key={o.id} className="hover:bg-cloud/40">
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted">{dt(o.created_at)}</td>
                  <td className="px-4 py-2.5"><Link href={`/admin/orders/${o.id}`} className="font-medium underline">{o.order_no}</Link></td>
                  <td className="px-4 py-2.5">{String(o.recipient.name ?? "")}</td>
                  <td className="px-4 py-2.5">{items[0]?.product_name}{items.length > 1 ? ` 외 ${items.length - 1}` : ""} · {items.reduce((s, i) => s + i.quantity, 0).toLocaleString()}개</td>
                  <td className="px-4 py-2.5">{won(o.total_amount)}</td>
                  <td className="px-4 py-2.5">{STATUS_LABEL[o.status]}</td>
                  <td className="px-4 py-2.5">{o.tax_invoice ? "요청" : "-"}</td>
                </tr>
              );
            }),
          )}
        </Table>
      )}
      <Pager page={page} pages={pages} base={`/admin/orders?status=${status}&q=${encodeURIComponent(q)}`} />
    </>
  );
}
