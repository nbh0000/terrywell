import "server-only";
import { getDb } from "@/lib/db";

// 포트원 V2. 상점 아이디·채널 키·API 시크릿이 모두 있으면 실제(테스트 채널) 결제창,
// 하나라도 없으면 사이트 안의 테스트 결제(mock)로 동작한다.

export const portone = {
  storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID ?? "",
  channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY ?? "",
  secret: process.env.PORTONE_API_SECRET ?? "",
};

export const paymentMode: "portone" | "mock" = portone.storeId && portone.channelKey && portone.secret ? "portone" : "mock";

/** 결제 단건 조회로 금액·상태를 서버에서 검증 */
export async function verifyPortonePayment(paymentId: string, expectedAmount: number) {
  const res = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `PortOne ${portone.secret}` },
    cache: "no-store",
  });
  if (!res.ok) return { ok: false as const, error: `결제 조회 실패 (${res.status})` };
  const p = (await res.json()) as { status: string; amount?: { total?: number }; method?: unknown; paidAt?: string };
  if (p.status !== "PAID") return { ok: false as const, error: `결제가 완료되지 않았습니다 (${p.status})` };
  if (p.amount?.total !== expectedAmount) return { ok: false as const, error: "결제 금액이 주문 금액과 다릅니다." };
  return { ok: true as const, payment: p };
}

/**
 * 결제 완료 처리. portone 모드는 결제 단건 조회로 금액을 검증하고,
 * mock 모드(키 없음)는 테스트 결제로 바로 완료한다. 결제된 장바구니 줄은 지운다.
 */
export async function markOrderPaid(orderId: string, userId: string, paymentId: string | null): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  const order = await db.get("orders", { id: orderId });
  if (!order || order.user_id !== userId) return { ok: false, error: "주문을 찾을 수 없습니다." };
  if (order.status !== "pending") return { ok: true };

  let payment: Record<string, unknown>;
  if (paymentMode === "portone") {
    if (!paymentId) return { ok: false, error: "결제 정보가 없습니다." };
    const v = await verifyPortonePayment(paymentId, order.total_amount);
    if (!v.ok) return { ok: false, error: v.error };
    payment = { provider: "portone", paymentId, ...v.payment };
  } else {
    payment = { provider: "mock", paymentId: `mock-${order.order_no}`, paidAt: new Date().toISOString(), note: "포트원 키 미설정 — 테스트 결제" };
  }

  const cartIds = (order.payment as { cart_item_ids?: string[] } | null)?.cart_item_ids ?? [];
  await db.update("orders", { id: order.id }, { status: "paid", payment: { ...payment, cart_item_ids: cartIds } });
  for (const id of cartIds) {
    const it = await db.get("cart_items", { id });
    if (it && it.user_id === userId) await db.remove("cart_items", { id });
  }
  return { ok: true };
}
