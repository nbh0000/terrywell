"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function updateProfileAction(_: { ok?: boolean; error?: string } | undefined, fd: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다." };
  const s = (k: string) => String(fd.get(k) ?? "").trim().slice(0, 100);
  if (!s("name")) return { error: "이름을 입력해 주세요." };
  // 권한(role) 같은 값은 바꿀 수 없게 필요한 필드만 받는다
  await getDb().update("profiles", { id: user.id }, { name: s("name"), phone: s("phone"), company_name: s("company_name"), business_number: s("business_number") });
  revalidatePath("/mypage", "layout");
  return { ok: true };
}
