"use server";

import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { notifyAdmin } from "@/lib/notify";
import { putFile } from "@/lib/storage";

const MAX_FILE = 20 * 1024 * 1024;
const MAX_FILES = 5;

export type QuoteState = { ok?: boolean; error?: string } | undefined;

export async function submitQuoteAction(_: QuoteState, fd: FormData): Promise<QuoteState> {
  const s = (k: string, n = 200) => String(fd.get(k) ?? "").trim().slice(0, n);
  const data = {
    company: s("company"),
    name: s("name"),
    phone: s("phone", 30),
    email: s("email"),
    product: s("product"),
    quantity: s("quantity", 30),
    due_date: s("due_date", 20),
    message: s("message", 3000),
  };
  if (!data.name || !data.phone || !data.email) return { error: "이름, 연락처, 이메일을 입력해 주세요." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { error: "이메일 형식을 확인해 주세요." };
  if (!/^[0-9-+ ]{8,20}$/.test(data.phone)) return { error: "연락처를 확인해 주세요." };
  if (fd.get("agree") !== "on") return { error: "개인정보 수집·이용에 동의해 주세요." };

  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_FILES) return { error: `첨부 파일은 ${MAX_FILES}개까지 올릴 수 있습니다.` };
  if (files.some((f) => f.size > MAX_FILE)) return { error: "파일 하나당 20MB 이하만 올릴 수 있습니다." };

  const id = randomUUID();
  const attachments = [];
  for (const f of files) {
    const ext = (f.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
    const path = `quotes/${id}/${randomUUID()}.${ext}`;
    await putFile("uploads", path, Buffer.from(await f.arrayBuffer()), f.type || "application/octet-stream");
    attachments.push({ name: f.name.slice(0, 200), path, size: f.size });
  }

  const user = await getCurrentUser();
  await getDb({ admin: true }).insert("quote_requests", { id, user_id: user?.id ?? null, ...data, attachments, status: "new", admin_memo: "" });
  await notifyAdmin("새 견적문의", { id, name: data.name, company: data.company, product: data.product, quantity: data.quantity });
  return { ok: true };
}
