import type { OrderStatus } from "@/lib/db/types";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "결제대기",
  paid: "결제완료",
  producing: "제작중",
  shipping: "배송중",
  done: "배송완료",
  cancelled: "취소",
};
