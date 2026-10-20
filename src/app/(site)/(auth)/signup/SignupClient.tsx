"use client";

import { useQuery } from "@/lib/page";
import { AuthCard } from "../AuthCard";
import { SignupForm } from "./SignupForm";

export function SignupClient() {
  const q = useQuery();
  return (
    <AuthCard title="회원가입">
      <SignupForm next={q?.get("next") || "/"} />
    </AuthCard>
  );
}
