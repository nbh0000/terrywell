// 견적 문의 접수 (PHP /api/quote, 첨부 포함 multipart)

import { apiForm } from "@/lib/api";

export type QuoteState = { ok?: boolean; error?: string } | undefined;

export async function submitQuoteAction(_: QuoteState, fd: FormData): Promise<QuoteState> {
  try {
    return await apiForm<NonNullable<QuoteState>>("quote", fd);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "보내지 못했습니다." };
  }
}
