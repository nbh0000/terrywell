// 주문서 제출·결제 완료 (PHP /api/orders/*). 금액 계산과 결제 검증은 서버가 한다

import { apiPost, tryApi } from "@/lib/api";

export interface CheckoutInput {
  itemIds: string[];
  recipient: { name: string; phone: string; zip: string; address1: string; address2: string; memo: string };
  taxInvoice: { requested: boolean; company_name: string; business_number: string; ceo: string; email: string; business_type: string; business_item: string };
}

export type CreateOrderResult =
  | { ok: true; orderId: string; orderNo: string; amount: number; orderName: string; mode: "portone" | "mock" }
  | { ok: false; error: string };

export function createOrderAction(input: CheckoutInput): Promise<CreateOrderResult> {
  return tryApi(() => apiPost<CreateOrderResult>("orders/create", input));
}

export function completePaymentAction(orderId: string, paymentId: string | null): Promise<{ ok: boolean; error?: string }> {
  return tryApi(() => apiPost<{ ok: boolean; error?: string }>("orders/complete", { orderId, paymentId }));
}
