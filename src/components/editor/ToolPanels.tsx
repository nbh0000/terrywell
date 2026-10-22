"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, ChevronDown, FileUp, ImagePlus, Plus, Trash2 } from "lucide-react";
import { fmtMm, workSize, type DesignDoc, type LabelSpec } from "@/lib/editor/types";
import { PALETTE, type ToolKey } from "./constants";
import { renderPage } from "./fabric-setup";
import { ACCEPT_FILES, ACCEPT_IMAGES, downscale, importFile } from "./importFile";
import { QrPanel } from "./QrPanel";
import type { EditorApi, EditorSticker, EditorTemplate } from "./Editor";

const btn = "h-12 w-full rounded-[8px] border border-[#dcdcdc] bg-white text-[15px] transition-colors hover:border-ink/40";

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
      return <AiPanel ed={p.ed} label={p.label} loggedIn={p.loggedIn} />;
    case "sticker":
      return <StickerPanel ed={p.ed} stickers={p.stickers} />;
    case "background":
      return <BackgroundPanel ed={p.ed} />;
    case "code":
      return <QrPanel ed={p.ed} />;
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

// 사진 패널: 이미지 불러오기 · 파일 불러오기(PDF·AI·SVG) · 카메라 촬영
function PhotoPanel({ ed, photos, setPhotos }: { ed: EditorApi; photos: { id: string; url: string }[]; setPhotos: (fn: (p: { id: string; url: string }[]) => { id: string; url: string }[]) => void }) {
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const frameSelected = ed.selection?.kind === "frame";

  async function onFiles(files: FileList | null, el: HTMLInputElement | null) {
    if (!files?.length) return;
    setErr(null);
    setBusy(true);
    for (const f of Array.from(files)) {
      try {
        const list = await importFile(f);
        setPhotos((prev) => [...list.map((x) => ({ id: crypto.randomUUID(), url: x.url })), ...prev]);
        // 첫 장만 바로 넣고, 여러 쪽 PDF 의 나머지는 아래 목록에서 고른다
        if (list[0]) await ed.addImage(list[0].url, "photo");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "파일을 불러오지 못했습니다.");
      }
    }
    setBusy(false);
    if (el) el.value = "";
  }

  async function onCamera(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setErr(null);
    setBusy(true);
    try {
      const url = await downscale(f);
      setPhotos((prev) => [{ id: crypto.randomUUID(), url }, ...prev]);
      await ed.addImage(url, "photo");
    } catch {
      setErr("사진을 불러오지 못했습니다.");
    }
    setBusy(false);
    if (cameraInput.current) cameraInput.current.value = "";
  }

  const big = "flex h-[74px] flex-col items-center justify-center gap-1.5 rounded-[8px] border border-[#dcdcdc] bg-white text-[13.5px] transition-colors hover:border-ink/40 disabled:opacity-50";
  return (
    <div>
      <input ref={imageInput} type="file" accept={ACCEPT_IMAGES} multiple hidden onChange={(e) => onFiles(e.target.files, imageInput.current)} />
      <input ref={fileInput} type="file" accept={`${ACCEPT_FILES},${ACCEPT_IMAGES}`} multiple hidden onChange={(e) => onFiles(e.target.files, fileInput.current)} />
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onCamera(e.target.files)} />
      <div className="grid grid-cols-3 gap-2">
        <button type="button" className={big} onClick={() => imageInput.current?.click()} disabled={busy}>
          <ImagePlus size={20} strokeWidth={1.6} /> 이미지 불러오기
        </button>
        <button type="button" className={big} onClick={() => fileInput.current?.click()} disabled={busy}>
          <FileUp size={20} strokeWidth={1.6} /> 파일 불러오기
        </button>
        <button type="button" className={big} onClick={() => cameraInput.current?.click()} disabled={busy}>
          <Camera size={20} strokeWidth={1.6} /> 카메라 촬영
        </button>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-muted">
        {busy ? "불러오는 중… " : ""}
        {frameSelected ? "선택한 사진틀 안에 사진이 들어갑니다. " : ""}
        JPG · PNG · WEBP · GIF · SVG · PDF · AI(PDF 호환 저장) 파일을 넣을 수 있습니다. PNG 투명 배경은 그대로 유지됩니다. EPS 는 PDF 로 저장해서 불러와 주세요.
      </p>
      {err && <p role="alert" className="mt-1 text-[12px] text-alert">{err}</p>}
      {photos.length > 0 && (
        <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-4">
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
      <MyAiImages ed={ed} />
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
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
        {list.map((t) => (
          <li key={t.id}>
            <button type="button" onClick={() => ed.applyTemplate(t.doc as DesignDoc)} className="block w-full overflow-hidden rounded-[6px] border border-line bg-white text-left">
              <div className="grid aspect-[68/48] place-items-center bg-cloud">
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

type AiMe = { loggedIn: boolean; quota?: { enabled: boolean; limit: number; used: number; remaining: number; styles: string[] }; images?: string[] };

function useAiMe() {
  const [me, setMe] = useState<AiMe | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/ai/me").then((r) => r.json()).then((d) => alive && setMe(d)).catch(() => alive && setMe({ loggedIn: false }));
    return () => {
      alive = false;
    };
  }, []);
  return [me, setMe] as const;
}

type AiTurn = { prompt: string; style: string | null; refs: string[]; base: string | null; images?: string[]; error?: string };

/** 채팅식 AI 패널: 글 + 사진 첨부로 요청하고, 결과를 골라 이어서 고칠 수 있다. 요청 1번 = 생성 1회 */
function AiPanel({ ed, label, loggedIn }: { ed: EditorApi; label: LabelSpec; loggedIn: boolean }) {
  const [me, setMe] = useAiMe();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<string | null>(null);
  const [refs, setRefs] = useState<string[]>([]);
  const [base, setBase] = useState<string | null>(null);
  const [turns, setTurns] = useState<AiTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [turns, busy]);

  if (!loggedIn || me?.loggedIn === false) {
    return (
      <p className="py-4 text-center text-[14px] text-muted">
        AI 생성은{" "}
        <Link href={`/login?next=${encodeURIComponent(typeof location !== "undefined" ? location.pathname + location.search : "/")}`} className="text-ink underline">로그인</Link>
        {" "}후 사용할 수 있습니다. 지금 편집한 내용은 임시 저장됩니다.
      </p>
    );
  }
  const q = me?.quota;
  const styles = q?.styles ?? [];
  const disabled = busy || !q || !q.enabled || q.remaining <= 0 || prompt.trim().length < 2;

  async function attach(files: FileList | null) {
    if (!files) return;
    setErr(null);
    const room = 3 - refs.length;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, room);
    if (files.length > room) setErr("사진은 한 번에 3장까지 넣을 수 있습니다.");
    try {
      const urls = await Promise.all(list.map((f) => downscale(f, 1536)));
      setRefs((r) => [...r, ...urls].slice(0, 3));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "사진을 읽지 못했습니다.");
    }
  }

  async function send() {
    if (disabled) return;
    const turn: AiTurn = { prompt: prompt.trim(), style, refs, base };
    const history = turns.map((t) => t.prompt);
    setTurns((t) => [...t, turn]);
    setPrompt("");
    setRefs([]);
    setBusy(true);
    setErr(null);
    const done = (patch: Partial<AiTurn>) => setTurns((t) => t.map((x) => (x === turn ? { ...x, ...patch } : x)));
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: turn.prompt, style: style ?? "", images: turn.refs, base: turn.base ?? "", history, aspect: { w: label.widthMm, h: label.heightMm } }),
      });
      const data = await res.json();
      if (data.quota) setMe((m) => (m ? { ...m, quota: data.quota, images: [...(data.images ?? []), ...(m.images ?? [])] } : m));
      if (!res.ok) throw new Error(data.error ?? "생성하지 못했습니다.");
      done({ images: data.images });
      setBase(data.images?.[0] ?? null);
    } catch (e) {
      done({ error: e instanceof Error ? e.message : "생성하지 못했습니다." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {turns.length === 0 && (
        <p className="text-[12.5px] leading-relaxed text-muted">
          만들고 싶은 그림을 글로 적고, 참고할 사진이 있으면 함께 넣습니다. 결과가 나오면 이어서 &ldquo;배경을 더 밝게&rdquo;처럼 고칠 수 있습니다.
        </p>
      )}
      {turns.length > 0 && (
        <ol className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
          {turns.map((t, i) => (
            <li key={i} className="space-y-1.5">
              <div className="ml-6 rounded-[8px] bg-cloud px-3 py-2 text-[13.5px]">
                {t.base && <span className="mb-1 block text-[11.5px] text-muted">선택한 이미지를 고치는 요청</span>}
                {t.prompt}
                {t.style && <span className="ml-1 text-[12px] text-muted">· {t.style}</span>}
                {t.refs.length > 0 && (
                  <span className="mt-1.5 flex gap-1.5">
                    {t.refs.map((u, k) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={k} src={u} alt="첨부한 사진" className="h-12 w-12 rounded-[4px] object-cover" />
                    ))}
                  </span>
                )}
              </div>
              {t.error && <p role="alert" className="mr-6 text-[12.5px] text-alert">{t.error}</p>}
              {t.images && (
                <ul className="mr-6 grid grid-cols-2 gap-2">
                  {t.images.map((u) => (
                    <li key={u} className="overflow-hidden rounded-[6px] border border-line">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="AI 생성 이미지" className="aspect-[68/48] w-full object-cover" />
                      <span className="grid grid-cols-2 border-t border-line text-[12px]">
                        <button type="button" onClick={() => ed.addImage(u, "ai")} className="py-1.5 hover:bg-cloud">라벨에 넣기</button>
                        <button type="button" onClick={() => setBase(base === u ? null : u)} className={`border-l border-line py-1.5 ${base === u ? "bg-ink text-white" : "hover:bg-cloud"}`}>
                          {base === u ? "고치는 중" : "이어서 고치기"}
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          {busy && <li className="mr-6 aspect-[68/48] w-1/2 animate-pulse rounded-[6px] bg-cloud" aria-label="만드는 중" />}
          <li ref={endRef} aria-hidden className="h-0" />
        </ol>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {styles.map((s) => (
          <button key={s} type="button" onClick={() => setStyle(style === s ? null : s)} className={`rounded-[6px] border px-2.5 py-1 text-[13px] ${style === s ? "border-ink bg-ink text-white" : "border-line"}`}>
            {s}
          </button>
        ))}
      </div>
      {(refs.length > 0 || base) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {base && (
            <span className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={base} alt="이어서 고칠 이미지" className="h-12 w-16 rounded-[4px] border border-ink object-cover" />
              <button type="button" onClick={() => setBase(null)} className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-ink text-[11px] text-white" aria-label="이어서 고치기 취소">×</button>
            </span>
          )}
          {refs.map((u, i) => (
            <span key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="첨부한 사진" className="h-12 w-12 rounded-[4px] border border-line object-cover" />
              <button type="button" onClick={() => setRefs((r) => r.filter((_, k) => k !== i))} className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-ink text-[11px] text-white" aria-label="사진 빼기">×</button>
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-end gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy || refs.length >= 3} className="grid h-11 w-11 shrink-0 place-items-center rounded-[8px] border border-line disabled:opacity-40" aria-label="참고 사진 넣기" title="참고 사진 넣기 (3장까지)">
          <ImagePlus size={18} />
        </button>
        <input ref={fileRef} type="file" accept={ACCEPT_IMAGES} multiple hidden onChange={(e) => { attach(e.target.files); e.target.value = ""; }} />
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          maxLength={500}
          rows={2}
          placeholder={base ? "예) 배경을 더 밝게, 잎사귀는 빼고" : "예) 레몬과 잎사귀, 파스텔 톤"}
          className="min-w-0 flex-1 resize-none rounded-[8px] border border-line p-2.5 text-[14px] outline-none focus:border-ink/50"
          aria-label="만들고 싶은 그림"
        />
        <button type="button" disabled={disabled} onClick={send} className="h-11 shrink-0 rounded-[8px] bg-ink px-4 text-[14px] text-white disabled:opacity-40">
          {busy ? "만드는 중" : "보내기"}
        </button>
      </div>
      {q && <p className="mt-1.5 text-right text-[12px] text-muted">오늘 남은 무료 생성 {q.remaining}/{q.limit}회 · 보낼 때마다 1회</p>}
      {q && !q.enabled && <p className="mt-2 text-[12.5px] text-alert">지금은 AI 생성을 사용할 수 없습니다.</p>}
      {q && q.enabled && q.remaining <= 0 && <p className="mt-2 text-[12.5px] text-alert">오늘 무료 생성 횟수를 모두 사용했습니다. 내일 다시 이용할 수 있습니다.</p>}
      {err && <p role="alert" className="mt-2 text-[12.5px] text-alert">{err}</p>}
    </div>
  );
}

/** 사진 패널 아래: 이전에 만든 AI 이미지 */
function MyAiImages({ ed }: { ed: EditorApi }) {
  const [me] = useAiMe();
  if (!me?.images?.length) return null;
  return (
    <div className="mt-4 border-t border-line pt-3">
      <h3 className="text-[13px] text-muted">내 AI 이미지</h3>
      <ul className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-4">
        {me.images.map((u) => (
          <li key={u}>
            <button type="button" onClick={() => ed.addImage(u, "ai")} className="block aspect-square w-full overflow-hidden rounded-[6px] border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-full w-full object-cover" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StickerPanel({ ed, stickers }: { ed: EditorApi; stickers: EditorSticker[] }) {
  if (!stickers.length) return <p className="py-4 text-center text-[14px] text-muted">등록된 스티커가 없습니다.</p>;
  return (
    <ul className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-5">
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
        <button type="button" onClick={() => picker.current?.click()} className="grid size-10 place-items-center rounded-[8px] border-2 border-point text-point" aria-label="커스텀 색상 추가">
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
