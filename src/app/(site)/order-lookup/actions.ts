"use server";

import { getDb } from "@/lib/db";
import { STATUS_LABEL } from "@/lib/orders";

export type LookupState =
  | {
      error?: string;
      order?: {
        id: string;
        no: string;
        date: string;
        status: string;
        tracking: string | null;
        total: number;
        key: string;
        items: { name: string; color: string | null; quantity: number; amount: number }[];
      };
    }
  | undefined;

const digits = (s: string) => s.replace(/\D/g, "");

// 비회원 주문 조회: 주문번호 + 받는 분 연락처가 모두 맞을 때만 보여 준다
export async function lookupOrderAction(_: LookupState, fd: FormData): Promise<LookupState> {
  const no = String(fd.get("order_no") ?? "").trim().slice(0, 40);
  const phone = digits(String(fd.get("phone") ?? "")).slice(0, 20);
  if (!no || phone.length < 8) return { error: "주문번호와 연락처를 정확히 입력해 주세요." };
  const db = getDb({ admin: true });
  const order = await db.get("orders", { order_no: no });
  if (!order || order.status === "pending" || digits(String(order.recipient.phone ?? "")) !== phone) {
    return { error: "일치하는 주문이 없습니다. 주문번호와 연락처를 다시 확인해 주세요." };
  }
  const items = await db.select("order_items", { where: { order_id: order.id } });
  return {
    order: {
      id: order.id,
      no: order.order_no,
      date: new Date(order.created_at).toLocaleDateString("ko-KR"),
      status: STATUS_LABEL[order.status],
      tracking: order.tracking_no,
      total: order.total_amount,
      key: phone.slice(-4),
      items: items.map((it) => ({ name: it.product_name, color: it.color_name, quantity: it.quantity, amount: it.line_amount })),
    },
  };
}
