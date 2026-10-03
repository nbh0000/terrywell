import type { Metadata } from "next";
import { AuthCard } from "../AuthCard";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  return (
    <AuthCard title="로그인">
      <LoginForm next={next} notice={sp.reset ? "비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요." : undefined} />
    </AuthCard>
  );
}
