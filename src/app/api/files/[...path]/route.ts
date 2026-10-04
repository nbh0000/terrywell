import { getCurrentUser } from "@/lib/auth";
import { PRIVATE_BUCKETS, readFile, type Bucket } from "@/lib/storage";

const TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
  tif: "image/tiff",
  tiff: "image/tiff",
  ai: "application/postscript",
  eps: "application/postscript",
  json: "application/json",
};

// 저장소 파일 내려주기. 비공개 버킷은 경로 첫 폴더가 본인 id 이거나 관리자일 때만.
export async function GET(_req: Request, ctx: RouteContext<"/api/files/[...path]">) {
  const [bucket, ...rest] = (await ctx.params).path;
  const filePath = rest.join("/");
  if (!bucket || !filePath) return new Response("Not found", { status: 404 });

  if (PRIVATE_BUCKETS.includes(bucket as Bucket)) {
    const user = await getCurrentUser();
    if (!user || (rest[0] !== user.id && user.role !== "admin")) return new Response("Forbidden", { status: 403 });
  }
  const data = await readFile(bucket as Bucket, filePath);
  if (!data) return new Response("Not found", { status: 404 });
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": PRIVATE_BUCKETS.includes(bucket as Bucket) ? "private, max-age=60" : "public, max-age=31536000, immutable",
    },
  });
}
