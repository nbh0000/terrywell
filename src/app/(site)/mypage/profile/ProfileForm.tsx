"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { updateProfileAction } from "./actions";

export function ProfileForm({ user }: { user: { email: string; name: string; phone: string; company_name: string; business_number: string } }) {
  const [state, action] = useActionState(updateProfileAction, undefined);
  return (
    <form action={action} className="max-w-[440px] space-y-4">
      <Field label="이메일" value={user.email} disabled readOnly />
      <Field label="이름" name="name" defaultValue={user.name} required />
      <Field label="연락처" name="phone" type="tel" defaultValue={user.phone} />
      <Field label="회사명" name="company_name" defaultValue={user.company_name} hint="세금계산서 요청 시 기본값으로 쓰입니다." />
      <Field label="사업자등록번호" name="business_number" defaultValue={user.business_number} placeholder="000-00-00000" />
      <FormMessage error={state?.error} message={state?.ok ? "저장했습니다." : undefined} />
      <SubmitButton>저장하기</SubmitButton>
    </form>
  );
}
