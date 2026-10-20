// 회원정보 수정 (브라우저 → PHP /api/db. 이름·연락처·회사·사업자번호만 서버가 받아 준다)

import { getCurrentUser, resetSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function updateProfileAction(_: { ok?: boolean; error?: string } | undefined, fd: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const s = (k: string) => String(fd.get(k) ?? "").trim().slice(0, 100);
  if (!s("name")) return { error: "이름을 입력해 주세요." };
  try {
    await getDb().update("profiles", { id: user.id }, { name: s("name"), phone: s("phone"), company_name: s("company_name"), business_number: s("business_number") });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "저장하지 못했습니다." };
  }
  resetSession();
  return { ok: true };
}
