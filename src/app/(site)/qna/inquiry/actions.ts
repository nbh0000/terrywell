// 1:1 문의 접수 (PHP /api/inquiries, 첨부 포함 multipart. 로그인 필요)

import { apiForm } from "@/lib/api";

export type InquiryState = { ok?: boolean; id?: string; error?: string } | undefined;

export async function createInquiryAction(_: InquiryState, fd: FormData): Promise<InquiryState> {
  try {
    return await apiForm<NonNullable<InquiryState>>("inquiries", fd);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "보내지 못했습니다." };
  }
}
