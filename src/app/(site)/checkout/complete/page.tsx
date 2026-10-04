import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { won } from "@/lib/pricing";
import { markOrderPaid } from "@/lib/payment";

export const metadata: Metadata = { title: "결제 완료", robots: { index: false } };

// 모바일 결제는 리다이렉트로 돌아오므로 여기서도 결제 확인을 한 번 더 한다
export default async function CompletePage({ searchParams }: PageProps<"/checkout/complete">) {
  const sp = await searchParams;
  const orderId = typeof sp.order === "string" ? sp.order : "";
  const user = await requireUser("/mypage");
  const db = getDb();
  let order = await db.get("orders", { id: orderId });
  if (!order || order.user_id !== user.id) notFound();
  if (order.status === "pending" && typeof sp.paymentId === "string" && !sp.code) {
    await markOrderPaid(order.id, user.id, sp.paymentId);
    order = (await db.get("orders", { id: orderId }))!;
  }
  const paid = order.status !== "pending" && order.status !== "cancelled";
  return (
    <section className="mx-auto w-full max-w-[560px] px-5 py-24 text-center">
      <h1 className="text-[24px] font-semibold">{paid ? "주문이 완료되었습니다" : "결제가 완료되지 않았습니다"}</h1>
      <p className="mt-3 text-[14px] text-muted">주문번호 {order.order_no}</p>
      <p className="mt-6 text-[26px] font-semibold text-point">{won(order.total_amount)}</p>
      {!paid && typeof sp.message === "string" && <p className="mt-3 text-[13px] text-alert">{sp.message}</p>}
      <div className="mt-10 flex justify-center gap-2">
        <Link href="/mypage" className="flex h-12 items-center bg-ink px-6 text-[15px] text-white">주문 내역 보기</Link>
        <Link href="/products" className="flex h-12 items-center border border-ink px-6 text-[15px]">쇼핑 계속하기</Link>
      </div>
    </section>
  );
}
