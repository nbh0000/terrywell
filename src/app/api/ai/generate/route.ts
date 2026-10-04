import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { getProvider } from "@/lib/ai/providers";
import { getQuota, kstDate } from "@/lib/ai/quota";
import { getDb } from "@/lib/db";
import { putFile } from "@/lib/storage";

// 같은 회원의 동시 요청으로 한도를 넘지 않게 프로세스 안에서 직렬화한다
const inflight = new Set<string>();

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "로그인 후 사용할 수 있습니다." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { prompt?: string; style?: string; aspect?: { w: number; h: number } } | null;
  const prompt = (body?.prompt ?? "").trim().slice(0, 500);
  const style = (body?.style ?? "").trim().slice(0, 30);
  const aspect = body?.aspect && body.aspect.w > 0 && body.aspect.h > 0 ? body.aspect : { w: 65, h: 45 };
  if (prompt.length < 2) return Response.json({ error: "만들고 싶은 그림을 입력해 주세요." }, { status: 400 });

  if (inflight.has(user.id)) return Response.json({ error: "이전 생성이 끝난 뒤 다시 시도해 주세요." }, { status: 429 });
  inflight.add(user.id);
  try {
    const quota = await getQuota(user.id);
    if (!quota.enabled) return Response.json({ error: "지금은 AI 생성을 사용할 수 없습니다." }, { status: 403 });
    if (quota.remaining <= 0) return Response.json({ error: "오늘 무료 생성 횟수를 모두 사용했습니다.", quota }, { status: 429 });

    const provider = getProvider();
    const count = Math.max(1, Math.min(4, Number(process.env.AI_IMAGES_PER_REQUEST ?? 2)));
    const db = getDb({ admin: true });
    const id = randomUUID();
    try {
      const images = await provider.generate({ prompt, style, aspect, count });
      const urls = await Promise.all(images.map((buf, i) => putFile("ai-images", `${user.id}/${id}-${i}.png`, buf, "image/png")));
      await db.insert("ai_generations", {
        id,
        user_id: user.id,
        prompt,
        style,
        provider: provider.name,
        result_paths: urls,
        success: true,
        error: null,
        cost_estimate: provider.costPerImageKrw * images.length,
        kst_date: kstDate(),
      });
      return Response.json({ images: urls, quota: { ...quota, used: quota.used + 1, remaining: quota.remaining - 1 } });
    } catch (e) {
      const message = e instanceof Error ? e.message : "생성 실패";
      await db.insert("ai_generations", {
        id, user_id: user.id, prompt, style, provider: provider.name, result_paths: [], success: false, error: message, cost_estimate: 0, kst_date: kstDate(),
      });
      // 실패는 횟수에서 빼고 안내만 한다
      return Response.json({ error: "이미지를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.", quota }, { status: 502 });
    }
  } finally {
    inflight.delete(user.id);
  }
}
