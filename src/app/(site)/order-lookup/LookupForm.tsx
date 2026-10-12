"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { lookupOrderAction } from "./actions";

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export function LookupForm() {
  const [state, action] = useActionState(lookupOrderAction, undefined);
  const o = state?.order;
  return (
    <>
      <form action={action} className="mt-10 space-y-4">
        <Field label="주문번호" name="order_no" required placeholder="예) TW261012-123456" />
        <Field label="받는 분 연락처" name="phone" type="tel" required placeholder="010-0000-0000" autoComplete="tel" />
        <FormMessage error={state?.error} />
        <SubmitButton>주문 조회</SubmitButton>
      </form>
      {o && (
        <div className="mt-10 border border-line bg-paper p-5">
          <div className="flex items-center justify-between border-b border-line pb-3 text-[13px]">
            <span className="text-muted">{o.date} · 주문번호 {o.no}</span>
            <span className="rounded-[4px] bg-ink px-2 py-0.5 text-[12px] text-white">{o.status}</span>
          </div>
          <ul className="mt-3 space-y-1 text-[14px]">
            {o.items.map((it, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>{it.name}{it.color ? ` · ${it.color}` : ""} · {it.quantity.toLocaleString()}개</span>
                <span>{won(it.amount)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-line pt-3 text-[14px]">
            <span className="text-muted">{o.tracking ? `송장번호 ${o.tracking}` : "배송 준비 중"}</span>
            <span className="font-semibold">{won(o.total)}</span>
          </div>
          <div className="mt-3 flex gap-2 text-[13px]">
            <a href={`/print/orders/${o.id}?doc=quote&k=${o.key}`} target="_blank" rel="noopener" className="inline-flex h-8 items-center rounded-[6px] border border-line px-3">견적서 출력</a>
            <a href={`/print/orders/${o.id}?doc=statement&k=${o.key}`} target="_blank" rel="noopener" className="inline-flex h-8 items-center rounded-[6px] border border-line px-3">거래명세서 출력</a>
          </div>
        </div>
      )}
      <p className="mt-8 text-center text-[13px] text-muted">
        회원이시면 <Link href="/login?next=/mypage" className="text-ink underline">로그인</Link> 후 마이페이지에서 모든 주문을 볼 수 있습니다.
      </p>
    </>
  );
}
