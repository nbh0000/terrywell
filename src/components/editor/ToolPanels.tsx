"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { fmtMm, workSize, type DesignDoc, type LabelSpec } from "@/lib/editor/types";
import { PALETTE, type ToolKey } from "./constants";
import { renderPage } from "./fabric-setup";
import type { EditorApi, EditorSticker, EditorTemplate } from "./Editor";

const btn = "h-12 w-full rounded-[8px] border border-[#dcdcdc] bg-white text-[15px] transition-colors hover:border-ink/40";
const MAX_UPLOAD = 20 * 1024 * 1024;

export function ToolPanel(p: {
  tool: ToolKey;
  ed: EditorApi;
  label: LabelSpec;
  templates: EditorTemplate[];
  stickers: EditorSticker[];
  photos: { id: string; url: string }[];
  setPhotos: (fn: (prev: { id: string; url: string }[]) => { id: string; url: string }[]) => void;
  loggedIn: boolean;
}) {
  switch (p.tool) {
    case "size":
      return <SizePanel label={p.label} />;
    case "page":
      return <PagePanel ed={p.ed} label={p.label} />;
    case "photo":
      return <PhotoPanel ed={p.ed} photos={p.photos} setPhotos={p.setPhotos} />;
    case "frame":
      return <FramePanel ed={p.ed} />;
    case "text":
      return (
        <div className="flex flex-col gap-2">
          <button type="button" className={`${btn} text-[19px] font-bold`} onClick={() => p.ed.addText("title")}>제목 추가하기</button>
          <button type="button" className={`${btn} text-[16px] font-medium`} onClick={() => p.ed.addText("subtitle")}>부제목 추가하기</button>
          <button type="button" className={`${btn} text-[13px]`} onClick={() => p.ed.addText("body")}>본문 내용 추가하기</button>
        </div>
      );
    case "design":
      return <DesignPanel ed={p.ed} templates={p.templates} />;
    case "ai":
      return <AiPanel loggedIn={p.loggedIn} />;
    case "sticker":
      return <StickerPanel ed={p.ed} stickers={p.stickers} />;
    case "background":
      return <BackgroundPanel ed={p.ed} />;
  }
}

function SizePanel({ label }: { label: LabelSpec }) {
  const { w, h } = workSize(label);
  const rows = [
    ["재단 사이즈", `${fmtMm(label.widthMm)} x ${fmtMm(label.heightMm)} mm`],
    ["작업 사이즈", `${fmtMm(w)} x ${fmtMm(h)} mm (도련 ${fmtMm(label.bleedMm)}mm)`],
    ["안전 영역", `재단선 안쪽 ${fmtMm(label.safeMm)}mm`],
    ["모서리", label.cornerMm ? `라운드 ${fmtMm(label.cornerMm)}mm` : "직각"],
  ];
  return (
    <div>
      <dl className="divide-y divide-line text-[14px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between py-2.5">
            <dt className="text-muted">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[12px] text-muted">라벨 크기는 제품마다 정해져 있어 변경할 수 없습니다.</p>
    </div>
  );
}

function PagePanel({ ed, label }: { ed: EditorApi; label: LabelSpec }) {
  if (!label.allowPages) return <p className="py-4 text-center text-[14px] text-muted">이 제품은 1페이지로 제작합니다.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: ed.pageCount }, (_, i) => (
        <div key={i} className={`flex items-center gap-1 rounded-[8px] border px-3 py-2 text-[14px] ${i === ed.pageIndex ? "border-ink" : "border-line"}`}>
          <button type="button" onClick={() => ed.goPage(i)}>{i + 1}페이지</button>
          {ed.pageCount > 1 && (
            <button type="button" aria-label={`${i + 1}페이지 삭제`} onClick={() => ed.removePage(i)} className="text-muted"><Trash2 size={14} /></button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => ed.addPage()} className="flex items-center gap-1 rounded-[8px] border border-dashed border-line px-3 py-2 text-[14px]"><Plus size={14} />페이지 추가</button>
    </div>
  );
}

/** 큰 사진은 줄여서 쓴다 (300dpi 라벨에 2400px 이면 충분) */
async function downscale(file: File, max = 2400): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * s);
    c.height = Math.round(img.naturalHeight * s);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL(file.type === "image/png" || file.type === "image/webp" ? "image/png" : "image/jpeg", 0.9);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function PhotoPanel({ ed, photos, setPhotos }: { ed: EditorApi; photos: { id: string; url: string }[]; setPhotos: (fn: (p: { id: string; url: string }[]) => { id: string; url: string }[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const frameSelected = ed.selection?.kind === "frame";
  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setErr(null);
    setBusy(true);
    for (const f of Array.from(files)) {
      if (!/^image\/(png|jpeg|webp)$/.test(f.type)) {
        setErr("PNG, JPG, WEBP 이미지만 올릴 수 있습니다.");
        continue;
      }
      if (f.size > MAX_UPLOAD) {
        setErr("20MB 이하 이미지만 올릴 수 있습니다.");
        continue;
      }
      const url = await downscale(f);
      setPhotos((prev) => [{ id: crypto.randomUUID(), url }, ...prev]);
      await ed.addImage(url, "photo");
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  }
  return (
    <div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      <button type="button" className={btn} onClick={() => input.current?.click()} disabled={busy}>{busy ? "불러오는 중…" : "이미지 불러오기"}</button>
      <p className="mt-2 text-[12px] text-muted">
        {frameSelected ? "선택한 사진틀 안에 사진이 들어갑니다. " : ""}PNG 투명 배경을 그대로 쓸 수 있습니다.
      </p>
      {err && <p role="alert" className="mt-1 text-[12px] text-alert">{err}</p>}
      {photos.length > 0 && (
        <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {photos.map((ph) => (
            <li key={ph.id}>
              <button type="button" onClick={() => ed.addImage(ph.url, "photo")} className="block aspect-square w-full overflow-hidden rounded-[6px] border border-line bg-[repeating-conic-gradient(#f0f0f0_0_25%,#fff_0_50%)] bg-[length:12px_12px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ph.url} alt="" className="h-full w-full object-contain" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FramePanel({ ed }: { ed: EditorApi }) {
  const shapes: { key: "rect" | "round" | "circle" | "ellipse"; label: string; cls: string }[] = [
    { key: "rect", label: "사각형", cls: "rounded-none w-12 h-9" },
    { key: "round", label: "둥근 사각형", cls: "rounded-[8px] w-12 h-9" },
    { key: "circle", label: "원", cls: "rounded-full w-10 h-10" },
    { key: "ellipse", label: "타원", cls: "rounded-[50%] w-12 h-9" },
  ];
  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {shapes.map((s) => (
          <button key={s.key} type="button" onClick={() => ed.addFrame(s.key)} className="flex flex-col items-center gap-2 rounded-[8px] border border-line py-3 text-[12px]">
            <span className={`block border border-dashed border-[#9a9a9a] bg-[#e9e9e9] ${s.cls}`} />
            {s.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-muted">사진틀을 넣고 선택한 뒤 [사진]에서 이미지를 고르면 틀 모양대로 들어갑니다.</p>
    </div>
  );
}

function DesignPanel({ ed, templates }: { ed: EditorApi; templates: EditorTemplate[] }) {
  const cats = ["전체", ...Array.from(new Set(templates.map((t) => t.category))).filter((c) => c !== "전체")];
  const [cat, setCat] = useState("전체");
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    (async () => {
      for (const t of templates) {
        const doc = t.doc as DesignDoc;
        try {
          const url = await renderPage(doc.pages[0], doc.label, { width: 360, area: "trim" });
          if (alive) setThumbs((prev) => ({ ...prev, [t.id]: url }));
        } catch {}
      }
    })();
    return () => {
      alive = false;
    };
  }, [templates]);
  const list = templates.filter((t) => cat === "전체" || t.category === cat);
  if (!templates.length) return <p className="py-4 text-center text-[14px] text-muted">등록된 디자인 템플릿이 없습니다.</p>;
  return (
    <div>
      <div className="relative mb-3">
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="h-11 w-full appearance-none rounded-[8px] border border-line bg-white px-3 text-[14px]" aria-label="템플릿 분류">
          {cats.map((c) => (
            <option key={c} value={c}>{c === "전체" ? `전체보기 (${templates.length})` : c}</option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3.5" />
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {list.map((t) => (
          <li key={t.id}>
            <button type="button" onClick={() => ed.applyTemplate(t.doc as DesignDoc)} className="block w-full overflow-hidden rounded-[6px] border border-line bg-white text-left">
              <div className="grid aspect-[65/45] place-items-center bg-cloud">
                {thumbs[t.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbs[t.id]} alt="" className="h-full w-full object-contain" />
                ) : null}
              </div>
              <span className="block px-2 py-1.5 text-[12px]">{t.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[12px] text-muted">템플릿을 적용한 뒤 글자를 두 번 누르면 바로 고칠 수 있습니다.</p>
    </div>
  );
}

function AiPanel({ loggedIn }: { loggedIn: boolean }) {
  return (
    <div className="py-2 text-center text-[14px] text-muted">
      AI 디자인 생성은 다음 작업 단계에서 연결합니다.
      {!loggedIn && (
        <p className="mt-1 text-[12px]">
          AI 생성은 <Link href="/login" className="underline">로그인</Link> 후 사용할 수 있습니다.
        </p>
      )}
    </div>
  );
}

function StickerPanel({ ed, stickers }: { ed: EditorApi; stickers: EditorSticker[] }) {
  if (!stickers.length) return <p className="py-4 text-center text-[14px] text-muted">등록된 스티커가 없습니다.</p>;
  return (
    <ul className="grid grid-cols-5 gap-2 sm:grid-cols-8">
      {stickers.map((s) => (
        <li key={s.id}>
          <button type="button" onClick={() => ed.addSvgSticker(s.url)} className="grid aspect-square w-full place-items-center rounded-[8px] border border-line bg-white p-2" aria-label={s.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.url} alt="" className="h-full w-full object-contain" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function BackgroundPanel({ ed }: { ed: EditorApi }) {
  const picker = useRef<HTMLInputElement>(null);
  const [custom, setCustom] = useState<string[]>([]);
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-[14px]">커스텀 색상</h3>
        <button type="button" onClick={() => ed.setBackground(null)} className="rounded-full border border-line px-3 py-1 text-[12px]">배경 삭제</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => picker.current?.click()} className="grid size-10 place-items-center rounded-[8px] border-2 border-alert text-alert" aria-label="커스텀 색상 추가">
          <Plus size={18} />
        </button>
        <input
          ref={picker}
          type="color"
          className="sr-only"
          onChange={(e) => {
            const v = e.target.value;
            setCustom((prev) => [v, ...prev.filter((x) => x !== v)].slice(0, 12));
            ed.setBackground(v);
          }}
        />
        {custom.map((c) => (
          <button key={c} type="button" onClick={() => ed.setBackground(c)} className="size-10 rounded-[8px] border border-line" style={{ background: c }} aria-label={c} />
        ))}
      </div>
      <h3 className="mt-4 border-t border-line pt-3 text-[14px]">기본 색상</h3>
      <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(36px,1fr))] gap-1.5">
        {PALETTE.map((c) => (
          <button key={c} type="button" onClick={() => ed.setBackground(c)} className="aspect-square rounded-[7px] border border-black/5" style={{ background: c }} aria-label={c} />
        ))}
      </div>
    </div>
  );
}
