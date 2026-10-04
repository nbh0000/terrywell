import { getDb } from "@/lib/db";
import { won } from "@/lib/pricing";
import { dt, inputCls, PageTitle, Pager, Table } from "../ui";

export const metadata = { title: "회원 관리" };
const PER = 30;

export default async function AdminMembers({ searchParams }: PageProps<"/admin/members">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const db = getDb({ admin: true });
  const [profiles, orders, gens] = await Promise.all([
    db.select("profiles", { order: [{ column: "created_at", ascending: false }] }),
    db.select("orders"),
    db.select("ai_generations", { where: { success: true } }),
  ]);
  const list = profiles.filter((p) => !q || p.email.includes(q) || p.name.includes(q) || p.phone.includes(q) || p.company_name.includes(q));
  const pages = Math.max(1, Math.ceil(list.length / PER));
  return (
    <>
      <PageTitle title={`회원 관리 (${profiles.length}명)`} />
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="이메일 · 이름 · 연락처 · 회사" className={`${inputCls} w-72!`} />
        <button className="h-10 rounded-[6px] bg-ink px-4 text-[14px] text-white">검색</button>
      </form>
      <Table head={["가입일", "이메일", "이름", "연락처", "회사", "주문", "구매 금액", "AI 생성"]}>
        {list.slice((page - 1) * PER, page * PER).map((p) => {
          const my = orders.filter((o) => o.user_id === p.id && o.status !== "pending" && o.status !== "cancelled");
          return (
            <tr key={p.id}>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted">{dt(p.created_at)}</td>
              <td className="px-4 py-2.5">{p.email}{p.role === "admin" && <span className="ml-1.5 rounded-[3px] bg-point px-1 text-[11px] text-white">관리자</span>}</td>
              <td className="px-4 py-2.5">{p.name}</td>
              <td className="px-4 py-2.5">{p.phone || "-"}</td>
              <td className="px-4 py-2.5">{p.company_name || "-"}</td>
              <td className="px-4 py-2.5">{my.length}건</td>
              <td className="px-4 py-2.5">{won(my.reduce((s, o) => s + o.total_amount, 0))}</td>
              <td className="px-4 py-2.5">{gens.filter((g) => g.user_id === p.id).length}회</td>
            </tr>
          );
        })}
      </Table>
      <Pager page={page} pages={pages} base={`/admin/members?q=${encodeURIComponent(q)}`} />
    </>
  );
}
