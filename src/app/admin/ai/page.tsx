import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { kstDaysAgo } from "@/lib/ai/quota";
import { getDb } from "@/lib/db";
import { won } from "@/lib/pricing";
import { getSetting } from "@/lib/site";
import { btnCls, Card, inputCls, Label, PageTitle, Table } from "../ui";

export const metadata = { title: "AI 설정" };

async function saveAi(fd: FormData) {
  "use server";
  await requireAdmin();
  const styles = String(fd.get("styles") ?? "").split(/[,\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 12);
  await getDb({ admin: true }).upsert("site_settings", {
    key: "ai",
    value: { enabled: fd.get("enabled") === "on", daily_free_limit: Math.max(0, Math.min(1000, Number(fd.get("daily_free_limit")) || 0)), styles },
    updated_at: new Date().toISOString(),
  }, ["key"]);
  revalidatePath("/admin/ai");
}

export default async function AdminAi() {
  const ai = await getSetting("ai");
  const db = getDb({ admin: true });
  const [gens, profiles] = await Promise.all([db.select("ai_generations", { order: [{ column: "created_at", ascending: false }] }), db.select("profiles")]);
  const since = kstDaysAgo(29);
  const recent = gens.filter((g) => g.kst_date >= since);
  const byDay = new Map<string, { ok: number; fail: number; cost: number }>();
  for (const g of recent) {
    const d = byDay.get(g.kst_date) ?? { ok: 0, fail: 0, cost: 0 };
    if (g.success) d.ok++;
    else d.fail++;
    d.cost += Number(g.cost_estimate);
    byDay.set(g.kst_date, d);
  }
  const byUser = new Map<string, { ok: number; cost: number }>();
  for (const g of recent.filter((g) => g.success)) {
    const u = byUser.get(g.user_id) ?? { ok: 0, cost: 0 };
    u.ok++;
    u.cost += Number(g.cost_estimate);
    byUser.set(g.user_id, u);
  }
  const email = (id: string) => profiles.find((p) => p.id === id)?.email ?? id.slice(0, 8);
  const provider = process.env.AI_PROVIDER ?? "mock";

  return (
    <>
      <PageTitle title="AI 설정" />
      <Card title="설정" className="mb-6">
        <form action={saveAi} className="grid gap-4 md:grid-cols-[180px_200px_1fr_auto] md:items-end">
          <label className="flex items-center gap-2 pb-2 text-[14px]"><input type="checkbox" name="enabled" defaultChecked={ai.enabled} className="accent-point" />AI 생성 사용</label>
          <Label label="1인 하루 무료 횟수"><input name="daily_free_limit" type="number" min={0} defaultValue={ai.daily_free_limit} className={inputCls} /></Label>
          <Label label="스타일 칩 (쉼표로 구분)"><input name="styles" defaultValue={ai.styles.join(", ")} className={inputCls} /></Label>
          <button className={btnCls}>저장</button>
        </form>
        <p className="mt-3 text-[12.5px] text-muted">
          현재 생성 엔진: <b>{provider}</b>{provider === "mock" ? " (키가 없어 비용 없는 목업 이미지가 나옵니다. .env 의 AI_PROVIDER 와 API 키로 바꿉니다.)" : ""}
        </p>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <h2 className="mb-2 text-[15px] font-semibold">최근 30일 일별 사용량</h2>
          <Table head={["날짜(KST)", "성공", "실패", "추정 비용"]}>
            {[...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([d, v]) => (
              <tr key={d}><td className="px-4 py-2">{d}</td><td className="px-4 py-2">{v.ok}</td><td className="px-4 py-2">{v.fail}</td><td className="px-4 py-2">{won(Math.round(v.cost))}</td></tr>
            ))}
          </Table>
        </div>
        <div>
          <h2 className="mb-2 text-[15px] font-semibold">최근 30일 회원별 사용량</h2>
          <Table head={["회원", "생성 횟수", "추정 비용"]}>
            {[...byUser.entries()].sort((a, b) => b[1].ok - a[1].ok).map(([u, v]) => (
              <tr key={u}><td className="px-4 py-2">{email(u)}</td><td className="px-4 py-2">{v.ok}</td><td className="px-4 py-2">{won(Math.round(v.cost))}</td></tr>
            ))}
          </Table>
        </div>
      </div>
      <h2 className="mb-2 mt-8 text-[15px] font-semibold">최근 생성 기록</h2>
      <Table head={["시각", "회원", "프롬프트", "스타일", "결과"]}>
        {gens.slice(0, 30).map((g) => (
          <tr key={g.id}>
            <td className="whitespace-nowrap px-4 py-2 text-muted">{new Date(g.created_at).toLocaleString("ko-KR")}</td>
            <td className="px-4 py-2">{email(g.user_id)}</td>
            <td className="max-w-[320px] truncate px-4 py-2">{g.prompt}</td>
            <td className="px-4 py-2">{g.style || "-"}</td>
            <td className="px-4 py-2">{g.success ? `${g.result_paths.length}장` : <span className="text-alert">실패</span>}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
