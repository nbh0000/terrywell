"use server";

import { redirect } from "next/navigation";
import { requestPasswordReset, resetPassword, signIn, signOut, signUp } from "@/lib/auth";

export type FormState = { error?: string; message?: string; devLink?: string } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// 외부 주소로 보내는 open redirect 방지
function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email");
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "이메일과 비밀번호를 입력해 주세요." };
  const r = await signIn(email, password);
  if (!r.ok) return { error: r.error };
  redirect(safeNext(str(fd, "next")));
}

export async function signupAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email");
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("password_confirm") ?? "");
  const name = str(fd, "name");
  const phone = str(fd, "phone");
  if (!email || !password || !name) return { error: "필수 항목을 입력해 주세요." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "이메일 형식을 확인해 주세요." };
  if (password.length < 8) return { error: "비밀번호는 8자 이상이어야 합니다." };
  if (password !== confirm) return { error: "비밀번호가 서로 다릅니다." };
  if (fd.get("agree_terms") !== "on" || fd.get("agree_privacy") !== "on") return { error: "필수 약관에 동의해 주세요." };
  const r = await signUp({ email, password, name, phone });
  if (!r.ok) return { error: r.error };
  redirect(safeNext(str(fd, "next")));
}

export async function forgotAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email");
  if (!email) return { error: "이메일을 입력해 주세요." };
  const r = await requestPasswordReset(email);
  if (!r.ok) return { error: r.error };
  return { message: "가입된 이메일이면 비밀번호 재설정 링크를 보냈습니다.", devLink: r.devLink };
}

export async function resetAction(_: FormState, fd: FormData): Promise<FormState> {
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: "비밀번호는 8자 이상이어야 합니다." };
  if (password !== String(fd.get("password_confirm") ?? "")) return { error: "비밀번호가 서로 다릅니다." };
  const r = await resetPassword(password, str(fd, "token") || undefined);
  if (!r.ok) return { error: r.error };
  redirect("/login?reset=1");
}

export async function logoutAction() {
  await signOut();
  redirect("/");
}
