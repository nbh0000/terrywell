// 비회원 주문 조회 (PHP /api/orders/lookup: 주문번호 + 받는 분 연락처가 모두 맞을 때만)

import { apiPost } from "@/lib/api";

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

export async function lookupOrderAction(_: LookupState, fd: FormData): Promise<LookupState> {
  try {
    return await apiPost<NonNullable<LookupState>>("orders/lookup", { order_no: String(fd.get("order_no") ?? ""), phone: String(fd.get("phone") ?? "") });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "조회하지 못했습니다." };
  }
}
