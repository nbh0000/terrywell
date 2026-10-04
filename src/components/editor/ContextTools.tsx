"use client";

import { useRef } from "react";
import { FabricImage, Textbox } from "fabric";
import {
  AlignCenter,
  AlignHorizontalJustifyCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  ArrowDownToLine,
  ArrowUpToLine,
  Baseline,
  Bold,
  Contrast,
  Copy,
  Crop,
  FlipHorizontal2,
  Italic,
  Keyboard,
  Lock,
  LockOpen,
  Palette,
  Replace,
  Sun,
  Trash2,
  Type,
} from "lucide-react";
import { K } from "@/lib/editor/types";
import { FONTS, PALETTE, PT_TO_MM } from "./constants";
import { metaOf } from "./fabric-setup";
import type { EditorApi } from "./Editor";

export type CtxKey = "font" | "size" | "color" | "spacing" | "stroke" | "opacity" | "crop" | "brightness";

type Item = { key: string; label: string; Icon: typeof Type; on: () => void; active?: boolean };

/** 요소를 선택했을 때 하단 툴바 자리에 나오는 도구 */
export function ContextBar({ ed, ctx, setCtx }: { ed: EditorApi; ctx: CtxKey | null; setCtx: (k: CtxKey | null) => void }) {
  const replaceInput = useRef<HTMLInputElement>(null);
  const o = ed.active();
  const sel = ed.selection;
  if (!o || !sel) return null;
  const locked = !!metaOf(o).locked;
  const toggle = (k: CtxKey) => () => setCtx(ctx === k ? null : k);

  const common: Item[] = [
    { key: "del", label: "삭제", Icon: Trash2, on: ed.remove },
    { key: "dup", label: "복제하기", Icon: Copy, on: () => void ed.duplicate() },
  ];
  const tail: Item[] = [
    { key: "ah", label: "가로 가운데", Icon: AlignHorizontalJustifyCenter, on: () => ed.align("h") },
    { key: "av", label: "세로 가운데", Icon: AlignVerticalJustifyCenter, on: () => ed.align("v") },
    { key: "up", label: "앞으로", Icon: ArrowUpToLine, on: () => ed.order("up") },
    { key: "down", label: "뒤로", Icon: ArrowDownToLine, on: () => ed.order("down") },
    { key: "opacity", label: "투명도", Icon: Contrast, on: toggle("opacity"), active: ctx === "opacity" },
    { key: "lock", label: locked ? "잠금 해제" : "잠그기", Icon: locked ? Lock : LockOpen, on: ed.toggleLock, active: locked },
  ];

  let mid: Item[] = [];
  if (o instanceof Textbox) {
    const align = o.textAlign ?? "center";
    const nextAlign = align === "left" ? "center" : align === "center" ? "right" : "left";
    mid = [
      {
        key: "edit",
        label: "입력",
        Icon: Keyboard,
        on: () => {
          if (locked) return;
          o.enterEditing();
          o.selectAll();
          ed.canvasRef.current?.requestRenderAll();
        },
      },
      { key: "font", label: "글꼴", Icon: Type, on: toggle("font"), active: ctx === "font" },
      { key: "size", label: "글자 크기", Icon: Baseline, on: toggle("size"), active: ctx === "size" },
      { key: "color", label: "글자 색상", Icon: Palette, on: toggle("color"), active: ctx === "color" },
      { key: "bold", label: "굵게", Icon: Bold, on: () => ed.modify((x) => x.set("fontWeight" as never, ((x as Textbox).fontWeight === "bold" ? "normal" : "bold") as never)), active: o.fontWeight === "bold" },
      { key: "italic", label: "기울임", Icon: Italic, on: () => ed.modify((x) => x.set("fontStyle" as never, ((x as Textbox).fontStyle === "italic" ? "normal" : "italic") as never)), active: o.fontStyle === "italic" },
      { key: "stroke", label: "테두리", Icon: Type, on: toggle("stroke"), active: ctx === "stroke" },
      {
        key: "align",
        label: "글자 정렬",
        Icon: align === "left" ? AlignLeft : align === "right" ? AlignRight : AlignCenter,
        on: () => ed.modify((x) => x.set("textAlign" as never, nextAlign as never)),
      },
      { key: "spacing", label: "자간/줄간격", Icon: AlignCenter, on: toggle("spacing"), active: ctx === "spacing" },
    ];
  } else if (o instanceof FabricImage) {
    mid = [
      { key: "crop", label: "자르기", Icon: Crop, on: toggle("crop"), active: ctx === "crop" },
      { key: "flip", label: "뒤집기", Icon: FlipHorizontal2, on: () => ed.modify((x) => x.set("flipX", !x.flipX)) },
      { key: "bright", label: "밝기", Icon: Sun, on: toggle("brightness"), active: ctx === "brightness" },
      { key: "replace", label: "교체", Icon: Replace, on: () => replaceInput.current?.click() },
    ];
  }

  const items = sel.kind === "multi" ? [common[0], ...tail.slice(0, 4)] : [...common, ...mid, ...tail];

  return (
    <>
      <input
        ref={replaceInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = () => ed.replaceImage(String(r.result));
          r.readAsDataURL(f);
          e.target.value = "";
        }}
      />
      {items.map(({ key, label, Icon, on, active }) => (
        <button
          key={key}
          type="button"
          onClick={on}
          className={`flex min-w-[62px] shrink-0 flex-col items-center gap-1 px-1.5 py-1.5 text-[11.5px] ${active ? "text-alert" : key === "del" ? "text-ink" : "text-ink"}`}
        >
          <Icon size={20} strokeWidth={1.6} />
          <span className="whitespace-nowrap">{label}</span>
        </button>
      ))}
    </>
  );
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="flex items-center gap-3 py-2 text-[13px]">
    <span className="w-16 shrink-0 text-muted">{label}</span>
    {children}
  </label>
);

/** 컨텍스트 도구의 세부 조절 패널 (바텀시트 안) */
export function ContextPanel({ ctxKey, ed }: { ctxKey: CtxKey; ed: EditorApi }) {
  const o = ed.active();
  if (!o) return null;
  const t = o instanceof Textbox ? o : null;
  const img = o instanceof FabricImage ? o : null;

  switch (ctxKey) {
    case "font":
      return (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FONTS.map((f) => (
            <li key={f.family}>
              <button
                type="button"
                onClick={async () => {
                  await document.fonts.load(`20px "${f.family}"`).catch(() => null);
                  ed.modify((x) => {
                    x.set("fontFamily" as never, f.family as never);
                    (x as Textbox).initDimensions();
                  });
                }}
                className={`h-12 w-full rounded-[8px] border text-[16px] ${t?.fontFamily === f.family ? "border-ink" : "border-line"}`}
                style={{ fontFamily: `"${f.family}"` }}
              >
                {f.label}
              </button>
            </li>
          ))}
        </ul>
      );
    case "size": {
      const pt = t ? Math.round(((t.fontSize ?? 10) * (t.scaleY ?? 1)) / K / PT_TO_MM * 2) / 2 : 10;
      const set = (v: number) =>
        ed.modify((x) => {
          x.set({ fontSize: (Math.max(4, Math.min(120, v)) * PT_TO_MM * K) / (x.scaleY ?? 1) } as never);
          (x as Textbox).initDimensions();
        });
      return (
        <div className="flex items-center justify-center gap-3 py-2">
          <button type="button" className="size-11 rounded-[8px] border border-line text-[20px]" onClick={() => set(pt - 0.5)}>−</button>
          <input type="number" step={0.5} value={pt} onChange={(e) => set(Number(e.target.value))} className="h-11 w-24 rounded-[8px] border border-line text-center text-[16px]" aria-label="글자 크기(pt)" />
          <span className="text-[13px] text-muted">pt</span>
          <button type="button" className="size-11 rounded-[8px] border border-line text-[20px]" onClick={() => set(pt + 0.5)}>+</button>
        </div>
      );
    }
    case "color":
      return <ColorGrid value={String(t?.fill ?? "")} onPick={(c) => ed.modify((x) => x.set("fill", c))} />;
    case "stroke": {
      const width = t ? (t.strokeWidth ?? 0) / K : 0;
      return (
        <div>
          <Row label="두께">
            <input type="range" min={0} max={1} step={0.05} value={t?.stroke ? width : 0} className="flex-1 accent-ink"
              onChange={(e) => ed.modify((x) => x.set({ strokeWidth: Number(e.target.value) * K, stroke: Number(e.target.value) ? ((x as Textbox).stroke || "#ffffff") : null, paintFirst: "stroke" } as never))} />
          </Row>
          <ColorGrid value={String(t?.stroke ?? "")} onPick={(c) => ed.modify((x) => x.set({ stroke: c, strokeWidth: x.strokeWidth || 0.3 * K, paintFirst: "stroke" } as never))} />
        </div>
      );
    }
    case "spacing":
      return (
        <div>
          <Row label="자간">
            <input type="range" min={-100} max={600} step={10} value={t?.charSpacing ?? 0} className="flex-1 accent-ink" onChange={(e) => ed.modify((x) => x.set("charSpacing" as never, Number(e.target.value) as never))} />
          </Row>
          <Row label="줄간격">
            <input type="range" min={0.8} max={2.4} step={0.05} value={t?.lineHeight ?? 1.16} className="flex-1 accent-ink" onChange={(e) => ed.modify((x) => x.set("lineHeight" as never, Number(e.target.value) as never))} />
          </Row>
        </div>
      );
    case "opacity":
      return (
        <Row label="투명도">
          <input type="range" min={0.1} max={1} step={0.05} value={o.opacity ?? 1} className="flex-1 accent-ink" onChange={(e) => ed.modify((x) => x.set("opacity", Number(e.target.value)))} />
          <span className="w-10 text-right tabular-nums">{Math.round((o.opacity ?? 1) * 100)}%</span>
        </Row>
      );
    case "brightness": {
      const cur = (img?.filters?.[0] as { brightness?: number } | undefined)?.brightness ?? 0;
      return (
        <Row label="밝기">
          <input type="range" min={-0.5} max={0.5} step={0.02} value={cur} className="flex-1 accent-ink" onChange={(e) => ed.setBrightness(Number(e.target.value))} />
        </Row>
      );
    }
    case "crop": {
      if (!img) return null;
      const el = img.getElement() as HTMLImageElement;
      const W = el.naturalWidth || img.width;
      const H = el.naturalHeight || img.height;
      const cur = { l: (img.cropX ?? 0) / W, t: (img.cropY ?? 0) / H, r: 1 - ((img.cropX ?? 0) + img.width) / W, b: 1 - ((img.cropY ?? 0) + img.height) / H };
      const set = (k: keyof typeof cur) => (e: React.ChangeEvent<HTMLInputElement>) => ed.setCrop({ ...cur, [k]: Number(e.target.value) });
      return (
        <div>
          {([["l", "왼쪽"], ["r", "오른쪽"], ["t", "위"], ["b", "아래"]] as const).map(([k, l]) => (
            <Row key={k} label={l}>
              <input type="range" min={0} max={0.45} step={0.01} value={Math.max(0, cur[k])} className="flex-1 accent-ink" onChange={set(k)} />
            </Row>
          ))}
          <button type="button" className="mt-1 text-[12px] text-muted underline" onClick={() => ed.setCrop({ l: 0, r: 0, t: 0, b: 0 })}>자르기 해제</button>
        </div>
      );
    }
  }
}

function ColorGrid({ value, onPick }: { value: string; onPick: (c: string) => void }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(32px,1fr))] gap-1.5">
      <label className="relative grid aspect-square cursor-pointer place-items-center rounded-[7px] border-2 border-alert text-[16px] text-alert" aria-label="직접 고르기">
        +
        <input type="color" className="absolute inset-0 opacity-0" onChange={(e) => onPick(e.target.value)} />
      </label>
      {PALETTE.map((c) => (
        <button key={c} type="button" onClick={() => onPick(c)} className={`aspect-square rounded-[7px] border ${value.toLowerCase() === c ? "border-ink ring-2 ring-ink/20" : "border-black/5"}`} style={{ background: c }} aria-label={c} />
      ))}
    </div>
  );
}
