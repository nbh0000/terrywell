"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { signupAction } from "../actions";

export function SignupForm({ next }: { next: string }) {
  const [state, action] = useActionState(signupAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="이메일" name="email" type="email" autoComplete="email" required />
      <Field label="비밀번호" name="password" type="password" autoComplete="new-password" minLength={8} hint="8자 이상" required />
      <Field label="비밀번호 확인" name="password_confirm" type="password" autoComplete="new-password" required />
      <Field label="이름" name="name" autoComplete="name" required />
      <Field label="연락처" name="phone" type="tel" autoComplete="tel" placeholder="010-0000-0000" />
      <div className="space-y-2.5 border-t border-line pt-5 text-sm">
        <label className="flex items-center gap-2.5">
          <input type="checkbox" name="agree_terms" className="size-4 accent-point" />
          <span>[필수] 이용약관 동의</span>
          <Link href="/terms" className="ml-auto text-xs text-muted underline">보기</Link>
        </label>
        <label className="flex items-center gap-2.5">
          <input type="checkbox" name="agree_privacy" className="size-4 accent-point" />
          <span>[필수] 개인정보 수집·이용 동의</span>
          <Link href="/privacy" className="ml-auto text-xs text-muted underline">보기</Link>
        </label>
      </div>
      <FormMessage error={state?.error} />
      <SubmitButton>가입하기</SubmitButton>
      <p className="pt-1 text-center text-[13px] text-muted">
        이미 계정이 있으면 <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-ink underline">로그인</Link>
      </p>
    </form>
  );
}
