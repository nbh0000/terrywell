"use client";

import "./fabric-setup";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CircleHelp,
  Eye,
  File as FileIcon,
  Image as ImageIcon,
  LayoutTemplate,
  Minus,
  PaintBucket,
  Plus,
  Redo2,
  Scaling,
  Sparkles,
  SquareDashed,
  Star,
  Type,
  Undo2,
  X,
} from "lucide-react";
import { fmtMm, workSize, type DesignDoc, type LabelSpec, type MockupSpec } from "@/lib/editor/types";
import { addDesignToCartAction, saveDesignAction } from "@/app/editor/[slug]/actions";
import { GUIDE, type ToolKey } from "./constants";
import { renderPage, renderPrintPng } from "./fabric-setup";
import { useLabelCanvas } from "./useLabelCanvas";
import { ContextBar, ContextPanel, type CtxKey } from "./ContextTools";
import { ToolPanel } from "./ToolPanels";
import { MockupPreview } from "./MockupPreview";
import { GuideModal } from "./GuideModal";

export interface EditorColor {
  id: string;
  name: string;
  swatch: string;
  mockup: MockupSpec;
}
export interface EditorTemplate {
  id: string;
  name: string;
  category: string;
  doc: unknown;
}
export interface EditorSticker {
  id: string;
  name: string;
  category: string;
  url: string;
}

const TOOLS: { key: ToolKey; label: string; Icon: typeof Type }[] = [
  { key: "size", label: "크기", Icon: Scaling },
  { key: "page", label: "페이지", Icon: FileIcon },
  { key: "photo", label: "사진", Icon: ImageIcon },
  { key: "frame", label: "사진틀", Icon: SquareDashed },
  { key: "text", label: "텍스트", Icon: Type },
  { key: "design", label: "디자인", Icon: LayoutTemplate },
  { key: "ai", label: "AI", Icon: Sparkles },
  { key: "sticker", label: "스티커", Icon: Star },
  { key: "background", label: "배경", Icon: PaintBucket },
];

// 화면 100% = 실제 크기 (96dpi 에서 1mm ≈ 3.78px, 캔버스 1mm = 10단위)
const MM_PX = 96 / 25.4 / 10;

type Modal = null | "exit" | "saving" | "saved" | "restore" | "guide";

export function Editor(props: {
  product: { id: string; slug: string; nameKo: string };
  label: LabelSpec;
  colors: EditorColor[];
  initialColorId: string | null;
  templates: EditorTemplate[];
  stickers: EditorSticker[];
  loggedIn: boolean;
  design: { id: string; name: string; doc: unknown; colorId: string | null } | null;
}) {
  const { product, label, colors } = props;
  const router = useRouter();
  const storageKey = `tw-editor:${product.id}:${props.design?.id ?? "new"}`;
  const [colorId, setColorId] = useState(props.initialColorId);
  const [designId, setDesignId] = useState(props.design?.id ?? null);
  const [tool, setTool] = useState<ToolKey | null>(null);
  const [ctx, setCtx] = useState<CtxKey | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const dirtyRef = useRef(false);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const areaRef = useRef<HTMLDivElement | null>(null);

  const initialPages = (props.design?.doc as DesignDoc | undefined)?.pages ?? null;

  const onChangeRef = useRef<() => void>(() => {});
  const ed = useLabelCanvas(label, initialPages, () => onChangeRef.current());
  const edRef = useRef(ed);
  useEffect(() => {
    edRef.current = ed;
  });

  const refreshPreview = useCallback(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => setPreviewUrl(edRef.current.trimPreview(520)), 120);
  }, []);

  function onChange() {
    dirtyRef.current = true;
    refreshPreview();
    // 로컬 임시저장 (3초 묶어서)
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ at: Date.now(), colorId, doc: edRef.current.getDoc() }));
      } catch {
        // 용량 초과 등은 무시 (서버 저장이 기준)
      }
    }, 3000);
  }

  // 캔버스 변경 알림은 최신 onChange 로
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // 화면 맞춤
  const fit = useCallback(() => {
    const el = areaRef.current;
    if (!el) return;
    const { w, h } = workSize(label);
    const pad = 64;
    const z = Math.min((el.clientWidth - pad) / (w * 10), (el.clientHeight - pad - 40) / (h * 10));
    edRef.current.setZoom(Math.max(0.2, z));
  }, [label]);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  // 첫 진입: 임시저장 복원 여부, 편집 가이드 1회
  useEffect(() => {
    let saved: { at: number } | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    } catch {}
    let seen = false;
    try {
      seen = localStorage.getItem("tw-editor-guide-seen") === "1";
    } catch {}
    // localStorage 는 서버 렌더에 없어서 마운트 후 다음 프레임에 연다
    const raf = requestAnimationFrame(() => {
      if (saved) setModal("restore");
      else if (!seen) setModal("guide");
    });
    const t = setTimeout(refreshPreview, 400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 키보드: 삭제, 실행취소
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input,textarea,select")) return;
      const c = edRef.current.canvasRef.current;
      const editing = (c?.getActiveObject() as { isEditing?: boolean } | undefined)?.isEditing;
      if (editing) return;
      if ((e.key === "Delete" || e.key === "Backspace") && c?.getActiveObject()) {
        e.preventDefault();
        edRef.current.remove();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) void edRef.current.redo();
        else void edRef.current.undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 저장 안 한 변경이 있으면 이탈 경고
  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, []);

  // 선택이 바뀌면 컨텍스트 패널 닫기
  const selKind = ed.selection?.kind ?? null;
  const selKey = ed.selection ? `${ed.selection.kind}` : "none";
  const [lastSelKey, setLastSelKey] = useState(selKey);
  if (selKey !== lastSelKey) {
    setLastSelKey(selKey);
    setCtx(null);
  }

  const color = colors.find((c) => c.id === colorId) ?? colors[0] ?? null;

  async function save() {
    if (!props.loggedIn) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ at: Date.now(), colorId, doc: ed.getDoc() }));
      } catch {}
      dirtyRef.current = false;
      router.push(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    setModal("saving");
    setError(null);
    try {
      ed.canvasRef.current?.discardActiveObject();
      const doc = ed.getDoc();
      const [thumbnail, printPng] = await Promise.all([
        renderPage(doc.pages[0], label, { width: 640, area: "trim" }),
        renderPrintPng(doc.pages[0], label),
      ]);
      const res = await saveDesignAction({
        designId: designId ?? undefined,
        productId: product.id,
        colorId,
        name: `${product.nameKo} 라벨`,
        doc,
        thumbnail,
        printPng,
      });
      if (!res.ok) {
        setError(res.error);
        setModal("exit");
        return;
      }
      setDesignId(res.designId);
      dirtyRef.current = false;
      try {
        localStorage.removeItem(storageKey);
      } catch {}
      router.replace(`/editor/${product.slug}?design=${res.designId}${colorId ? `&color=${colorId}` : ""}`, { scroll: false });
      setModal("saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했습니다.");
      setModal("exit");
    }
  }

  async function afterSave(action: "cart" | "buy" | "product") {
    if (action === "product") return router.push(`/products/${product.slug}?design=${designId ?? ""}${colorId ? `&color=${colorId}` : ""}`);
    if (!designId) return;
    const r = await addDesignToCartAction(designId);
    if (!r.ok) return setError(r.error ?? "장바구니에 담지 못했습니다.");
    router.push(action === "buy" ? `/checkout?items=${r.cartItemId}` : "/cart");
  }

  function exitWithoutSave() {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    dirtyRef.current = false;
    router.push(`/products/${product.slug}`);
  }

  async function restore(yes: boolean) {
    if (yes) {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
        if (saved?.doc) await ed.replaceDoc(saved.doc as DesignDoc);
        if (saved?.colorId) setColorId(saved.colorId);
      } catch {}
    } else {
      try {
        localStorage.removeItem(storageKey);
      } catch {}
    }
    setModal(null);
  }

  const { w: workW, h: workH } = workSize(label);
  const z = ed.zoom;
  const canvasPx = { w: workW * 10 * z, h: workH * 10 * z };

  const panelOpen = !!(ctx || (!selKind && tool));

  return (
    <div className="fixed inset-0 flex flex-col bg-[#eeeeee] text-ink">
      {/* 상단 바 */}
      <header className="flex h-[52px] shrink-0 items-center gap-2 bg-[#040301] px-3 text-white sm:px-4">
        <h1 className="min-w-0 flex-1 truncate text-[14px] sm:text-[15px]">{product.nameKo} · 라벨</h1>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button type="button" onClick={() => void ed.undo()} disabled={!ed.history.undo} aria-label="실행취소" className="p-2 disabled:opacity-30">
            <Undo2 size={20} />
          </button>
          <button type="button" onClick={() => void ed.redo()} disabled={!ed.history.redo} aria-label="다시실행" className="p-2 disabled:opacity-30">
            <Redo2 size={20} />
          </button>
          <button type="button" onClick={() => setModal("guide")} aria-label="편집 가이드" className="p-2">
            <CircleHelp size={21} />
          </button>
          <button type="button" onClick={() => setMobilePreview((v) => !v)} className="flex items-center gap-1 whitespace-nowrap rounded-[6px] px-2 py-1.5 text-[13px] lg:hidden" aria-pressed={mobilePreview}>
            <Eye size={16} /> 미리보기
          </button>
          <button type="button" onClick={() => setModal("exit")} className="ml-1 whitespace-nowrap rounded-[6px] bg-alert px-3 py-1.5 text-[13px] font-semibold sm:px-3.5 sm:text-[14px]">
            편집종료
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* 캔버스 영역 */}
        <div ref={areaRef} className="relative flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden" onPointerDown={(e) => {
          if (e.target !== e.currentTarget) return;
          const c = ed.canvasRef.current;
          c?.discardActiveObject();
          c?.requestRenderAll();
        }}>
          <div className="mb-2 flex items-center gap-4 text-[12.5px]">
            <span><span className="font-medium text-[#d1347a]">재단</span> {fmtMm(label.widthMm)} x {fmtMm(label.heightMm)} mm</span>
            <span><span className="font-medium text-[#7b3f98]">작업</span> {fmtMm(workW)} x {fmtMm(workH)} mm</span>
            <span>{ed.pageIndex + 1} / {ed.pageCount}p</span>
          </div>
          <div className="relative shadow-[0_1px_4px_rgba(0,0,0,0.08)]" style={{ width: canvasPx.w, height: canvasPx.h }}>
            <canvas ref={ed.elRef} />
            <Guides label={label} />
            {ed.selection && ed.selection.kind !== "multi" && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#4a4a4a] px-2.5 py-0.5 text-[11px] text-white"
                style={{ left: ed.selection.box.left + ed.selection.box.width / 2, top: Math.max(-26, ed.selection.box.top - 30) }}
              >
                {fmtMm(ed.selection.mm.w)} x {fmtMm(ed.selection.mm.h)} mm
              </div>
            )}
          </div>
          {/* 줌 */}
          <div className="absolute bottom-3 right-3 flex items-center rounded-full bg-white text-[12px] shadow-sm">
            <button type="button" className="p-2" aria-label="축소" onClick={() => ed.setZoom(z * 0.85)}><Minus size={14} /></button>
            <span className="w-11 text-center tabular-nums">{Math.round((z / MM_PX) * 100)}%</span>
            <button type="button" className="p-2" aria-label="확대" onClick={() => ed.setZoom(z * 1.15)}><Plus size={14} /></button>
            <button type="button" className="border-l border-line px-2.5 py-1.5" onClick={fit}>맞춤</button>
          </div>
        </div>

        {/* 미리보기: PC 오른쪽 패널 / 모바일 토글 */}
        <aside
          className={`${mobilePreview ? "flex" : "hidden"} absolute inset-0 z-20 flex-col overflow-y-auto bg-white p-5 lg:static lg:flex lg:w-[340px] lg:shrink-0 lg:border-l lg:border-line`}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold">미리보기</h2>
            <button type="button" className="p-1 lg:hidden" onClick={() => setMobilePreview(false)} aria-label="미리보기 닫기"><X size={18} /></button>
          </div>
          <MockupPreview color={color} labelUrl={previewUrl} label={label} />
          {colors.length > 1 && (
            <div className="mt-4">
              <p className="mb-2 text-[12px] text-muted">수건 색상</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColorId(c.id)}
                    className={`flex flex-col items-center gap-1 text-[11px] ${c.id === colorId ? "text-ink" : "text-muted"}`}
                  >
                    <span className={`block size-8 rounded-full border ${c.id === colorId ? "border-ink ring-2 ring-ink/15" : "border-line"}`} style={{ background: c.swatch }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="mt-5 text-[11.5px] leading-relaxed text-muted">미리보기는 화면용 참고 이미지이며 실제 원단 인쇄 색과 다를 수 있습니다.</p>
        </aside>
      </div>

      {/* 바텀시트 + 툴바 */}
      <div className="relative z-30 shrink-0">
        {panelOpen && (
          <div className="absolute bottom-full left-0 right-0 max-h-[46vh] overflow-y-auto rounded-t-[16px] bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:right-[340px]">
            <button type="button" onClick={() => (ctx ? setCtx(null) : setTool(null))} className="mx-auto block py-2.5" aria-label="패널 닫기">
              <span className="block h-1 w-10 rounded-full bg-[#d9d9d9]" />
            </button>
            <div className="px-4 pb-4">
              {ctx ? (
                <ContextPanel ctxKey={ctx} ed={ed} />
              ) : tool ? (
                <ToolPanel
                  tool={tool}
                  ed={ed}
                  label={label}
                  templates={props.templates}
                  stickers={props.stickers}
                  photos={photos}
                  setPhotos={setPhotos}
                  loggedIn={props.loggedIn}
                />
              ) : null}
            </div>
          </div>
        )}
        <nav className="flex h-[74px] items-center overflow-x-auto border-t border-line bg-white px-2 [scrollbar-width:none] lg:justify-center">
          {selKind ? (
            <ContextBar ed={ed} ctx={ctx} setCtx={setCtx} />
          ) : (
            TOOLS.map(({ key, label: l, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTool(tool === key ? null : key)}
                className={`flex min-w-[58px] shrink-0 flex-col items-center gap-1 rounded-[10px] px-2 py-1.5 text-[12px] ${tool === key ? "bg-white text-alert shadow-[0_1px_6px_rgba(0,0,0,0.12)]" : "text-ink"}`}
              >
                <Icon size={21} strokeWidth={1.6} />
                {l}
              </button>
            ))
          )}
        </nav>
      </div>

      {/* 모달 */}
      {modal === "guide" && (
        <GuideModal
          onClose={() => {
            try {
              localStorage.setItem("tw-editor-guide-seen", "1");
            } catch {}
            setModal(null);
          }}
        />
      )}
      {modal === "restore" && (
        <Dialog title="임시 저장된 작업이 있습니다" onClose={() => restore(false)}>
          <p className="text-[14px] text-muted">이전에 편집하던 내용을 불러올까요?</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" className="h-11 rounded-[6px] border border-line" onClick={() => restore(false)}>새로 시작</button>
            <button type="button" className="h-11 rounded-[6px] bg-ink text-white" onClick={() => restore(true)}>불러오기</button>
          </div>
        </Dialog>
      )}
      {modal === "exit" && (
        <Dialog title="편집을 종료할까요?" onClose={() => setModal(null)}>
          {!props.loggedIn && <p className="mb-3 text-[13px] text-muted">저장하려면 로그인이 필요합니다. 로그인 후 지금 작업을 이어서 저장할 수 있습니다.</p>}
          {error && <p role="alert" className="mb-3 text-[13px] text-alert">{error}</p>}
          <div className="flex flex-col gap-2">
            <button type="button" className="h-12 rounded-[6px] bg-ink text-[15px] text-white" onClick={save}>{props.loggedIn ? "저장하기" : "로그인하고 저장하기"}</button>
            <button type="button" className="h-12 rounded-[6px] border border-line text-[15px]" onClick={() => setModal(null)}>돌아가기</button>
            <button type="button" className="h-11 text-[13px] text-muted underline" onClick={exitWithoutSave}>저장 안 하고 종료</button>
          </div>
        </Dialog>
      )}
      {modal === "saving" && (
        <Dialog title="저장하는 중" onClose={() => {}}>
          <p className="text-[14px] text-muted">인쇄용 파일(300dpi PNG · PDF · CMYK)을 만들고 있습니다.</p>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-cloud"><div className="h-full w-1/3 animate-[tw-load_1.1s_ease-in-out_infinite] bg-point" /></div>
        </Dialog>
      )}
      {modal === "saved" && (
        <Dialog title="저장했습니다" onClose={() => setModal(null)}>
          {error && <p role="alert" className="mb-3 text-[13px] text-alert">{error}</p>}
          <div className="flex flex-col gap-2">
            <button type="button" className="h-12 rounded-[6px] bg-point text-[15px] text-white" onClick={() => afterSave("cart")}>장바구니 담기</button>
            <button type="button" className="h-12 rounded-[6px] bg-ink text-[15px] text-white" onClick={() => afterSave("buy")}>바로 결제</button>
            <button type="button" className="h-12 rounded-[6px] border border-line text-[15px]" onClick={() => afterSave("product")}>제품 페이지로</button>
            <button type="button" className="h-10 text-[13px] text-muted" onClick={() => setModal(null)}>계속 편집</button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

/** 가이드 선 3종. 캔버스 위 SVG 라서 저장·인쇄 파일에 들어가지 않는다 */
function Guides({ label }: { label: LabelSpec }) {
  const { w, h } = workSize(label);
  const b = label.bleedMm;
  const s = label.bleedMm + label.safeMm;
  const r = label.cornerMm;
  const line = { fill: "none", strokeWidth: 1.4, vectorEffect: "non-scaling-stroke" as const };
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <rect x={0.05} y={0.05} width={w - 0.1} height={h - 0.1} stroke={GUIDE.work} {...line} />
      <rect x={b} y={b} width={label.widthMm} height={label.heightMm} rx={r} stroke={GUIDE.trim} {...line} />
      <rect x={s} y={s} width={w - s * 2} height={h - s * 2} rx={Math.max(0, r - label.safeMm)} stroke={GUIDE.safe} {...line} />
    </svg>
  );
}

function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-5" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-[360px] rounded-[12px] bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-[17px] font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export type EditorApi = ReturnType<typeof useLabelCanvas>;
