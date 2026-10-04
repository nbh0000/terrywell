import { FabricObject, InteractiveFabricObject, StaticCanvas, util, type FabricObject as FO } from "fabric";
import { K, printPixels, workSize, type DesignDoc, type LabelSpec } from "@/lib/editor/types";

// 모든 객체에 tw(테리웰 메타데이터)를 저장하도록 등록
FabricObject.customProperties = ["tw"];

// 선택 핸들: 레퍼런스처럼 파란 원형 핸들 + 회색 점선 테두리
Object.assign(InteractiveFabricObject.ownDefaults, {
  cornerStyle: "circle",
  cornerColor: "#6f9be0",
  cornerStrokeColor: "#ffffff",
  transparentCorners: false,
  cornerSize: 11,
  touchCornerSize: 28,
  borderColor: "#8a8a8a",
  borderDashArray: [4, 3],
  borderScaleFactor: 1.2,
  padding: 2,
});

export interface TwMeta {
  kind?: "text" | "photo" | "frame" | "framedPhoto" | "sticker" | "ai";
  shape?: "rect" | "round" | "circle" | "ellipse";
  locked?: boolean;
}

export const metaOf = (o: FO | null | undefined): TwMeta => ((o as unknown as { tw?: TwMeta })?.tw ?? {});
export const setMeta = (o: FO, m: TwMeta) => o.set("tw" as never, { ...metaOf(o), ...m } as never);

/** 저장된 페이지 JSON 을 별도 캔버스에 그려 PNG data URL 로 만든다 (가이드·선택 표시 없음) */
export async function renderPage(page: unknown, label: LabelSpec, opts: { width: number; area?: "work" | "trim" }) {
  const { w, h } = workSize(label);
  const el = document.createElement("canvas");
  const sc = new StaticCanvas(el, { width: w * K, height: h * K, enableRetinaScaling: false });
  await sc.loadFromJSON(page as object);
  sc.renderAll();
  let url: string;
  if (opts.area === "trim") {
    const b = label.bleedMm * K;
    url = sc.toDataURL({ format: "png", left: b, top: b, width: label.widthMm * K, height: label.heightMm * K, multiplier: opts.width / (label.widthMm * K) });
  } else {
    url = sc.toDataURL({ format: "png", multiplier: opts.width / (w * K) });
  }
  sc.dispose();
  return url;
}

export async function renderPrintPng(page: unknown, label: LabelSpec) {
  return renderPage(page, label, { width: printPixels(label).w });
}

/**
 * 템플릿(다른 라벨 크기로 만들었을 수 있음)을 현재 라벨 크기에 맞게 옮긴 페이지 JSON 으로 바꾼다.
 */
export async function fitTemplate(doc: DesignDoc, label: LabelSpec): Promise<{ background: string; objects: FO[] }> {
  const src = workSize(doc.label);
  const dst = workSize(label);
  const r = Math.min(dst.w / src.w, dst.h / src.h);
  const offX = ((dst.w - src.w * r) / 2) * K;
  const offY = ((dst.h - src.h * r) / 2) * K;
  const page = (doc.pages[0] ?? {}) as { background?: string; objects?: object[] };
  const objects = (await util.enlivenObjects(page.objects ?? [])) as FO[];
  for (const o of objects) {
    o.set({ left: (o.left ?? 0) * r + offX, top: (o.top ?? 0) * r + offY, scaleX: (o.scaleX ?? 1) * r, scaleY: (o.scaleY ?? 1) * r });
    o.setCoords();
  }
  return { background: page.background ?? "#ffffff", objects };
}
