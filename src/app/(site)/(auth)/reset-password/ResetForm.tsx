"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { resetAction } from "../actions";

export function ResetForm({ token }: { token?: string }) {
  const [state, action] = useActionState(resetAction, undefined);
  return (
    <form action={action} className="space-y-4">
      {token && <input type="hidden" name="token" value={token} />}
      <Field label="새 비밀번호" name="password" type="password" autoComplete="new-password" minLength={8} hint="8자 이상" required />
      <Field label="새 비밀번호 확인" name="password_confirm" type="password" autoComplete="new-password" required />
      <FormMessage error={state?.error} />
      <SubmitButton>변경하기</SubmitButton>
    </form>
  );
}
