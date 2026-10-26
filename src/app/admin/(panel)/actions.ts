// 관리자 파일 업로드 (제품 사진, 목업, 스티커, 글꼴 등). PHP /api/upload, 공개 버킷만

import { apiForm } from "@/lib/api";

export type Bucket = "product-images" | "mockups" | "templates" | "stickers" | "fonts";

export async function adminUploadAction(fd: FormData): Promise<{ ok: true; url: string; name: string } | { ok: false; error: string }> {
  try {
    const r = await apiForm<{ ok: boolean; url?: string; name?: string; error?: string }>("upload", fd);
    return r.ok && r.url ? { ok: true, url: r.url, name: r.name ?? "" } : { ok: false, error: r.error ?? "올리지 못했습니다." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "올리지 못했습니다." };
  }
}

/** 캔버스 그림(data URL)을 올린다 (템플릿 썸네일 등) */
export async function adminUploadDataUrl(bucket: Bucket, dataUrl: string, name = ""): Promise<string | null> {
  const fd = new FormData();
  fd.set("bucket", bucket);
  fd.set("dataUrl", dataUrl);
  fd.set("name", name);
  const r = await adminUploadAction(fd);
  return r.ok ? r.url : null;
}
