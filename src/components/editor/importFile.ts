"use client";

// 에디터 [사진] 패널에서 불러오는 파일을 라벨에 넣을 이미지로 바꾼다.
// - JPG·PNG·WEBP·GIF: 큰 사진은 줄인다 (300dpi 라벨에 2400px 이면 충분)
// - SVG: 그대로 (벡터라 인쇄해도 깨지지 않는다)
// - PDF·AI(PDF 호환 저장): 페이지를 투명 배경 이미지로 그린다 (최대 4쪽)
// - EPS·PSD 등은 브라우저에서 읽을 수 없어 PDF·PNG 로 저장해서 올려 달라고 안내한다

export const ACCEPT_IMAGES = "image/png,image/jpeg,image/webp,image/gif";
export const ACCEPT_FILES = ".pdf,.ai,.svg,application/pdf,image/svg+xml,application/illustrator";
export const MAX_FILE = 30 * 1024 * 1024;

export interface Imported {
  url: string;
  kind: "image" | "svg";
  name: string;
}

export async function importFile(file: File): Promise<Imported[]> {
  if (file.size > MAX_FILE) throw new Error("30MB 이하 파일만 불러올 수 있습니다.");
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (file.type === "image/svg+xml" || ext === "svg") {
    const text = await file.text();
    if (!/<svg[\s>]/i.test(text)) throw new Error("SVG 파일을 읽지 못했습니다.");
    return [{ url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`, kind: "svg", name: file.name }];
  }
  if (/^image\/(png|jpeg|webp|gif)$/.test(file.type) || ["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
    return [{ url: await downscale(file), kind: "image", name: file.name }];
  }
  if (file.type === "application/pdf" || ext === "pdf" || ext === "ai") {
    return renderPdf(file);
  }
  if (["eps", "ps"].includes(ext)) throw new Error("EPS 파일은 브라우저에서 열 수 없습니다. 일러스트레이터에서 PDF 또는 PNG로 저장해서 불러와 주세요.");
  if (["psd", "heic", "heif", "tif", "tiff"].includes(ext)) throw new Error("이 형식은 바로 열 수 없습니다. JPG·PNG 로 저장해서 불러와 주세요.");
  throw new Error("JPG, PNG, WEBP, GIF, SVG, PDF, AI 파일만 불러올 수 있습니다.");
}

export async function downscale(file: Blob, max = 2400): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("이미지를 읽지 못했습니다."));
      i.src = url;
    });
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * s);
    c.height = Math.round(img.naturalHeight * s);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const keepAlpha = file.type === "image/png" || file.type === "image/webp" || file.type === "image/gif";
    return c.toDataURL(keepAlpha ? "image/png" : "image/jpeg", 0.92);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function renderPdf(file: File, maxPages = 4, max = 2400): Promise<Imported[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/vendor/pdf.worker.min.mjs`;
  let doc;
  try {
    doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  } catch {
    throw new Error(file.name.toLowerCase().endsWith(".ai") ? "AI 파일을 읽지 못했습니다. 일러스트레이터에서 저장할 때 'PDF 호환 파일 만들기'를 켜거나 PDF로 저장해 주세요." : "PDF 파일을 읽지 못했습니다.");
  }
  const out: Imported[] = [];
  for (let n = 1; n <= Math.min(doc.numPages, maxPages); n++) {
    const page = await doc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: max / Math.max(base.width, base.height) });
    const c = document.createElement("canvas");
    c.width = Math.round(viewport.width);
    c.height = Math.round(viewport.height);
    await page.render({ canvasContext: c.getContext("2d")!, viewport, background: "rgba(0,0,0,0)" }).promise;
    out.push({ url: c.toDataURL("image/png"), kind: "image", name: doc.numPages > 1 ? `${file.name} (${n}쪽)` : file.name });
  }
  await doc.destroy();
  return out;
}
