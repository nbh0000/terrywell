"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { loadCart } from "@/lib/cart";
import { getDb } from "@/lib/db";
import { markOrderPaid, paymentMode } from "@/lib/payment";

export interface CheckoutInput {
  itemIds: string[];
  recipient: { name: string; phone: string; zip: string; address1: string; address2: string; memo: string };
  taxInvoice: { requested: boolean; company_name: string; business_number: string; ceo: string; email: string; business_type: string; business_item: string };
}

function orderNo() {
  const d = new Date(Date.now() + 9 * 3600_000).toISOString();
  return `TW${d.slice(2, 4)}${d.slice(5, 7)}${d.slice(8, 10)}-${randomInt(100000, 999999)}`;
}

/** 주문서 제출: 금액은 서버에서 다시 계산해 '결제대기' 주문을 만든다 */
export async function createOrderAction(input: CheckoutInput): Promise<
  { ok: true; orderId: string; orderNo: string; amount: number; orderName: string; mode: "portone" | "mock" } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };
  const r = input.recipient;
  if (!r.name.trim() || !/^[0-9-]{9,14}$/.test(r.phone.trim()) || !r.address1.trim()) return { ok: false, error: "받는 분 정보(이름, 연락처, 주소)를 확인해 주세요." };
  const t = input.taxInvoice;
  if (t.requested && (!t.company_name.trim() || !/^\d{3}-?\d{2}-?\d{5}$/.test(t.business_number.trim()) || !t.email.trim()))
    return { ok: false, error: "세금계산서 정보(상호, 사업자등록번호, 이메일)를 확인해 주세요." };

  const cart = await loadCart(user.id, input.itemIds);
  if (!cart.lines.length) return { ok: false, error: "주문할 상품이 없습니다." };

  const db = getDb();
  const no = orderNo();
  const order = await db.insert("orders", {
    order_no: no,
    user_id: user.id,
    status: "pending",
    supply_amount: cart.supply,
    vat_amount: cart.vat,
    total_amount: cart.grandTotal,
    shipping_fee: cart.shipping,
    recipient: Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v).slice(0, 200)])),
    tax_invoice: t.requested ? { ...t } : null,
    payment: { cart_item_ids: cart.lines.map((l) => l.id) },
    tracking_no: null,
    updated_at: new Date().toISOString(),
  });
  for (const l of cart.lines) {
    await db.insert("order_items", {
      order_id: order.id,
      product_id: l.productId,
      product_name: l.productName,
      color_name: l.colorName,
      design_id: l.designId,
      upload_id: l.uploadId,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      line_amount: l.total,
    });
  }
  const orderName = cart.lines.length > 1 ? `${cart.lines[0].productName} 외 ${cart.lines.length - 1}건` : cart.lines[0].productName;
  return { ok: true, orderId: order.id, orderNo: no, amount: cart.grandTotal, orderName, mode: paymentMode };
}

export async function completePaymentAction(orderId: string, paymentId: string | null): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };
  const r = await markOrderPaid(orderId, user.id, paymentId);
  if (r.ok) {
    revalidatePath("/cart");
    revalidatePath("/mypage");
  }
  return r;
}
