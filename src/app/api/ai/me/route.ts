import { getCurrentUser } from "@/lib/auth";
import { getQuota } from "@/lib/ai/quota";
import { getDb } from "@/lib/db";

// 에디터 AI 패널: 오늘 남은 횟수 + 내 AI 이미지 목록
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ loggedIn: false });
  const [quota, gens] = await Promise.all([
    getQuota(user.id),
    getDb({ admin: true }).select("ai_generations", { where: { user_id: user.id, success: true }, order: [{ column: "created_at", ascending: false }], limit: 30 }),
  ]);
  return Response.json({ loggedIn: true, quota, images: gens.flatMap((g) => g.result_paths) });
}
