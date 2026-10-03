"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { loginAction } from "../actions";

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {notice && <p className="text-sm text-point">{notice}</p>}
      <Field label="이메일" name="email" type="email" autoComplete="email" required />
      <Field label="비밀번호" name="password" type="password" autoComplete="current-password" required />
      <FormMessage error={state?.error} />
      <SubmitButton>로그인</SubmitButton>
      <div className="flex justify-between pt-1 text-[13px] text-muted">
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="hover:text-ink">회원가입</Link>
        <Link href="/forgot-password" className="hover:text-ink">비밀번호 찾기</Link>
      </div>
    </form>
  );
}
