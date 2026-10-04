import Link from "next/link";
import { kstDate } from "@/lib/ai/quota";
import { getDb } from "@/lib/db";
import { STATUS_LABEL } from "@/lib/orders";
import { won } from "@/lib/pricing";
import { Card, dt, PageTitle } from "./ui";

export const metadata = { title: "대시보드" };

export default async function AdminHome() {
  const db = getDb({ admin: true });
  const today = kstDate();
  const [orders, quotes, gens] = await Promise.all([
    db.select("orders", { order: [{ column: "created_at", ascending: false }] }),
    db.select("quote_requests", { order: [{ column: "created_at", ascending: false }] }),
    db.select("ai_generations", { where: { kst_date: today } }),
  ]);
  const paid = orders.filter((o) => o.status !== "pending" && o.status !== "cancelled");
  const todayOrders = paid.filter((o) => kstDate(new Date(o.created_at)) === today);
  const toProduce = paid.filter((o) => o.status === "paid").length;
  const newQuotes = quotes.filter((q) => q.status === "new");
  const okGens = gens.filter((g) => g.success);

  const stats = [
    { label: "오늘 주문", value: `${todayOrders.length}건`, sub: won(todayOrders.reduce((s, o) => s + o.total_amount, 0)), href: "/admin/orders" },
    { label: "제작 대기 (결제완료)", value: `${toProduce}건`, href: "/admin/orders?status=paid" },
    { label: "새 견적문의", value: `${newQuotes.length}건`, href: "/admin/quotes" },
    { label: "오늘 AI 생성", value: `${okGens.length}회`, sub: `추정 비용 ${won(Math.round(okGens.reduce((s, g) => s + Number(g.cost_estimate), 0)))}`, href: "/admin/ai" },
  ];

  return (
    <>
      <PageTitle title="대시보드" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-[10px] border border-line bg-white p-5 hover:border-ink/30">
            <p className="text-[13px] text-muted">{s.label}</p>
            <p className="mt-1 text-[26px] font-semibold">{s.value}</p>
            {s.sub && <p className="text-[12.5px] text-muted">{s.sub}</p>}
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card title="최근 주문">
          {paid.length === 0 ? (
            <p className="text-[13px] text-muted">아직 주문이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-line text-[13.5px]">
              {paid.slice(0, 6).map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-point">
                    <span>{o.order_no} · {String(o.recipient.name ?? "")}</span>
                    <span className="flex items-center gap-3"><span className="text-muted">{STATUS_LABEL[o.status]}</span>{won(o.total_amount)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="최근 견적문의">
          {quotes.length === 0 ? (
            <p className="text-[13px] text-muted">아직 견적문의가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-line text-[13.5px]">
              {quotes.slice(0, 6).map((q) => (
                <li key={q.id}>
                  <Link href={`/admin/quotes/${q.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-point">
                    <span>{q.company ? `${q.company} · ` : ""}{q.name} · {q.product || "제품 미선택"}</span>
                    <span className="text-muted">{q.status === "new" ? "새 문의" : q.status === "in_progress" ? "처리중" : "완료"} · {dt(q.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
