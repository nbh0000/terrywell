"use client";

import { useQuery } from "@/lib/page";
import { AuthCard } from "../AuthCard";
import { ResetForm } from "./ResetForm";

export function ResetClient() {
  const q = useQuery();
  return (
    <AuthCard title="비밀번호 재설정">
      {q && <ResetForm token={q.get("token") || undefined} />}
    </AuthCard>
  );
}
