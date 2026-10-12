"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { INQUIRY_TYPES } from "@/lib/inquiry";
import { notifyAdmin } from "@/lib/notify";
import { putFile } from "@/lib/storage";

const MAX_FILE = 20 * 1024 * 1024;
const MAX_FILES = 5;

export type InquiryState = { ok?: boolean; id?: string; error?: string } | undefined;

export async function createInquiryAction(_: InquiryState, fd: FormData): Promise<InquiryState> {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인 후 문의할 수 있습니다." };
  const s = (k: string, n = 200) => String(fd.get(k) ?? "").trim().slice(0, n);
  const type = s("type", 60);
  const title = s("title", 120);
  const body = s("body", 5000);
  const orderNo = s("order_no", 40);
  if (!INQUIRY_TYPES.some((t) => t.label === type)) return { error: "문의 유형을 골라 주세요." };
  if (!title) return { error: "문의 제목을 입력해 주세요." };
  if (body.length < 5) return { error: "문의 내용을 조금 더 자세히 적어 주세요." };

  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_FILES) return { error: `첨부 파일은 ${MAX_FILES}개까지 올릴 수 있습니다.` };
  if (files.some((f) => f.size > MAX_FILE)) return { error: "파일 하나당 20MB 이하만 올릴 수 있습니다." };

  const id = randomUUID();
  const attachments = [];
  for (const f of files) {
    const ext = (f.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
    // 경로 첫 폴더 = 회원 id (본인·관리자만 받을 수 있다)
    const path = `${user.id}/inquiries/${id}/${randomUUID()}.${ext}`;
    await putFile("uploads", path, Buffer.from(await f.arrayBuffer()), f.type || "application/octet-stream");
    attachments.push({ name: f.name.slice(0, 200), path, size: f.size });
  }

  await getDb({ admin: true }).insert("inquiries", {
    id,
    user_id: user.id,
    type,
    order_no: orderNo,
    title,
    body,
    attachments,
    status: "waiting",
    answer_html: "",
    answered_at: null,
    updated_at: new Date().toISOString(),
  });
  await notifyAdmin("새 1:1 문의", { id, type, title, user: user.email });
  revalidatePath("/qna/inquiry");
  revalidatePath("/mypage/inquiries");
  return { ok: true, id };
}
