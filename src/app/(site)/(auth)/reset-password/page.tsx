import type { Metadata } from "next";
import { AuthCard } from "../AuthCard";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "비밀번호 재설정" };

export default async function ResetPage({ searchParams }: PageProps<"/reset-password">) {
  const sp = await searchParams;
  return (
    <AuthCard title="비밀번호 재설정">
      <ResetForm token={typeof sp.token === "string" ? sp.token : undefined} />
    </AuthCard>
  );
}
