import type { Metadata } from "next";
import { LookupForm } from "./LookupForm";

export const metadata: Metadata = { title: "비회원 주문 조회" };

export default function OrderLookupPage() {
  return (
    <section className="mx-auto w-full max-w-[480px] px-5 py-16 md:py-24">
      <h1 className="text-center text-2xl font-medium tracking-tight">비회원 주문 조회</h1>
      <p className="mt-3 text-center text-[13.5px] text-muted">주문할 때 입력한 받는 분 연락처로 확인합니다.</p>
      <LookupForm />
    </section>
  );
}
