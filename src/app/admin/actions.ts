"use server";

import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import { putFile, type Bucket } from "@/lib/storage";

const MAX = 30 * 1024 * 1024;
const PUBLIC: Bucket[] = ["product-images", "mockups", "templates"];

/** 관리자 파일 업로드 (제품 사진, 목업, 스티커, 제작 가이드 등). 공개 버킷만 */
export async function adminUploadAction(fd: FormData): Promise<{ ok: true; url: string; name: string } | { ok: false; error: string }> {
  await requireAdmin();
  const bucket = String(fd.get("bucket") ?? "product-images") as Bucket;
  if (!PUBLIC.includes(bucket)) return { ok: false, error: "허용되지 않은 위치입니다." };
  const file = fd.get("file");
  if (!(file instanceof File) || !file.size) return { ok: false, error: "파일을 선택해 주세요." };
  if (file.size > MAX) return { ok: false, error: "30MB 이하 파일만 올릴 수 있습니다." };
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  const url = await putFile(bucket, `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`, Buffer.from(await file.arrayBuffer()), file.type || "application/octet-stream");
  return { ok: true, url, name: file.name };
}
