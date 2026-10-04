import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { dataMode } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/server";

// 파일 저장소. Supabase 모드는 Storage 버킷, 로컬 모드는 .data/storage/<bucket>/<path>.
// 비공개 버킷(designs, uploads)은 /api/files 가 권한을 확인하고 내려준다.

export type Bucket = "product-images" | "mockups" | "templates" | "ai-images" | "designs" | "uploads";
export const PRIVATE_BUCKETS: Bucket[] = ["designs", "uploads"];

const LOCAL_ROOT = path.join(process.cwd(), ".data", "storage");

function safeJoin(bucket: string, p: string) {
  const full = path.join(LOCAL_ROOT, bucket, p);
  if (!full.startsWith(path.join(LOCAL_ROOT, bucket) + path.sep)) throw new Error("잘못된 파일 경로");
  return full;
}

/** 저장 후 사이트에서 쓸 URL 을 돌려준다 (비공개 버킷은 /api/files 경유) */
export async function putFile(bucket: Bucket, filePath: string, data: Buffer, contentType: string): Promise<string> {
  if (dataMode === "supabase") {
    const sb = createAdminClient();
    const { error } = await sb.storage.from(bucket).upload(filePath, data, { contentType, upsert: true });
    if (error) throw new Error(`[storage] ${error.message}`);
    if (!PRIVATE_BUCKETS.includes(bucket)) return sb.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
    return `/api/files/${bucket}/${filePath}`;
  }
  const full = safeJoin(bucket, filePath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, data);
  return `/api/files/${bucket}/${filePath}`;
}

export async function readFile(bucket: Bucket, filePath: string): Promise<Buffer | null> {
  if (dataMode === "supabase") {
    const { data, error } = await createAdminClient().storage.from(bucket).download(filePath);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  }
  try {
    return await fs.readFile(safeJoin(bucket, filePath));
  } catch {
    return null;
  }
}

export async function removeFiles(bucket: Bucket, filePaths: string[]) {
  if (dataMode === "supabase") {
    await createAdminClient().storage.from(bucket).remove(filePaths);
    return;
  }
  await Promise.all(filePaths.map((p) => fs.rm(safeJoin(bucket, p), { force: true })));
}

/** data:image/png;base64,... → Buffer */
export function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const m = /^data:([\w/+.-]+);base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("이미지 데이터 형식이 올바르지 않습니다.");
  return { mime: m[1], buffer: Buffer.from(m[2], "base64") };
}
