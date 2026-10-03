"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { forgotAction } from "../actions";

export function ForgotForm() {
  const [state, action] = useActionState(forgotAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">가입한 이메일로 비밀번호 재설정 링크를 보냅니다.</p>
      <Field label="이메일" name="email" type="email" autoComplete="email" required />
      <FormMessage error={state?.error} message={state?.message} />
      {state?.devLink && (
        <p className="rounded-[3px] bg-cloud p-3 text-xs text-muted">
          로컬 모드는 메일을 보내지 않습니다. 개발 확인용 링크:{" "}
          <Link href={state.devLink} className="text-point underline">재설정하기</Link>
        </p>
      )}
      <SubmitButton>링크 보내기</SubmitButton>
    </form>
  );
}
