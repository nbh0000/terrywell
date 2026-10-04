import "server-only";
import { getDb } from "@/lib/db";
import { getSetting } from "@/lib/site";

/** 한국시간 기준 오늘 날짜 (YYYY-MM-DD) */
export function kstDate(d = new Date()) {
  return new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}

/** 오늘 성공한 생성 횟수와 한도. 서버에서만 계산한다 (클라이언트 값 신뢰 안 함) */
export async function getQuota(userId: string) {
  const ai = await getSetting("ai");
  const used = await getDb({ admin: true }).count("ai_generations", { user_id: userId, kst_date: kstDate(), success: true });
  return { enabled: ai.enabled, limit: ai.daily_free_limit, used, remaining: Math.max(0, ai.daily_free_limit - used), styles: ai.styles };
}
