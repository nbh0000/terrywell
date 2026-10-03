import type { Metadata } from "next";
import { AuthCard } from "../AuthCard";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = { title: "비밀번호 찾기" };

export default function ForgotPage() {
  return (
    <AuthCard title="비밀번호 찾기">
      <ForgotForm />
    </AuthCard>
  );
}
