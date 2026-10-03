import type { Metadata } from "next";
import { AuthCard } from "../AuthCard";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "회원가입" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const sp = await searchParams;
  return (
    <AuthCard title="회원가입">
      <SignupForm next={typeof sp.next === "string" ? sp.next : "/"} />
    </AuthCard>
  );
}
