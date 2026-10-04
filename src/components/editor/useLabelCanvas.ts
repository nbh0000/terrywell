"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, Circle, Ellipse, FabricImage, Rect, Textbox, filters, loadSVGFromURL, util, type FabricObject } from "fabric";
import { K, workSize, type DesignDoc, type LabelSpec } from "@/lib/editor/types";
import { fitTemplate, metaOf, setMeta, type TwMeta } from "./fabric-setup";
import { PT_TO_MM } from "./constants";

const HISTORY_LIMIT = 60;
const blankPage = () => ({ version: "7", objects: [], background: "#ffffff" });

export interface SelectionInfo {
  kind: "text" | "image" | "frame" | "shape" | "multi";
  meta: TwMeta;
  /** 화면(캔버스 요소 기준) px */
  box: { left: number; top: number; width: number; height: number };
  /** 실제 크기 mm */
  mm: { w: number; h: number };
}

/**
 * Fabric 캔버스 하나로 라벨 페이지를 편집한다.
 * 좌표: 1mm = K 단위. 화면 배율(zoom)은 setZoom 으로만 바꾸므로 저장 데이터는 배율과 무관하다.
 */
export function useLabelCanvas(label: LabelSpec, initialPages: unknown[] | null, onChange: () => void) {
  const elRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const [initial] = useState<unknown[]>(() => (initialPages?.length ? initialPages : Array.from({ length: Math.max(1, label.pages) }, blankPage)));
  const pagesRef = useRef<unknown[]>(initial);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(initial.length);
  const [zoom, setZoomState] = useState(1);
  const zoomRef = useRef(1);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [, setTick] = useState(0); // 선택 객체 속성 변경 시 다시 그리기
  const undoRef = useRef<string[]>([]);
  const redoRef = useRef<string[]>([]);
  const lastRef = useRef<string>("");
  const pageIndexRef = useRef(0);
  const loadingRef = useRef(false);
  const [historyState, setHistoryState] = useState({ undo: false, redo: false });
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const { w: workW, h: workH } = workSize(label);

  const snapshot = useCallback(() => JSON.stringify(canvasRef.current?.toObject() ?? {}), []);

  const syncHistoryState = () => setHistoryState({ undo: undoRef.current.length > 0, redo: redoRef.current.length > 0 });

  const updateSelection = useCallback(() => {
    const c = canvasRef.current;
    const o = c?.getActiveObject();
    if (!c || !o) return setSelection(null);
    const r = o.getBoundingRect();
    const z = zoomRef.current;
    const meta = metaOf(o);
    const kind: SelectionInfo["kind"] =
      o.type === "activeselection" ? "multi" : o instanceof Textbox ? "text" : meta.kind === "frame" ? "frame" : o instanceof FabricImage ? "image" : "shape";
    setSelection({
      kind,
      meta,
      box: { left: r.left * z, top: r.top * z, width: r.width * z, height: r.height * z },
      mm: { w: (o.getScaledWidth() / K), h: (o.getScaledHeight() / K) },
    });
    setTick((t) => t + 1);
  }, []);

  /** 변경 기록 (실행취소용) + 상위에 알림 */
  const commit = useCallback(() => {
    if (loadingRef.current || !canvasRef.current) return;
    const s = snapshot();
    if (s === lastRef.current) return;
    if (lastRef.current) undoRef.current.push(lastRef.current);
    if (undoRef.current.length > HISTORY_LIMIT) undoRef.current.shift();
    redoRef.current = [];
    lastRef.current = s;
    pagesRef.current[pageIndexRef.current] = JSON.parse(s);
    syncHistoryState();
    onChangeRef.current();
  }, [snapshot]);

  const loadJson = useCallback(async (json: unknown) => {
    const c = canvasRef.current;
    if (!c) return;
    loadingRef.current = true;
    await c.loadFromJSON(json as object);
    loadingRef.current = false;
    // 불러오는 사이 캔버스가 정리됐으면(개발 모드 이중 마운트 등) 그리지 않는다
    if (canvasRef.current !== c) return;
    c.getObjects().forEach((o) => applyLock(o, !!metaOf(o).locked));
    c.requestRenderAll();
    await waitFonts(c, () => canvasRef.current === c);
  }, []);

  // 캔버스 생성
  useEffect(() => {
    if (!elRef.current) return;
    const c = new Canvas(elRef.current, {
      width: workW * K,
      height: workH * K,
      preserveObjectStacking: true,
      backgroundColor: "#ffffff",
      selectionColor: "rgba(76,120,187,0.08)",
      selectionBorderColor: "#4c78bb",
    });
    canvasRef.current = c;
    let disposed = false;
    (async () => {
      // 개발 모드 이중 마운트: 첫 번째 캔버스가 정리될 기회를 준 뒤 불러온다
      await Promise.resolve();
      if (disposed) return;
      await loadJson(pagesRef.current[0]);
      if (disposed) return;
      lastRef.current = snapshot();
      syncHistoryState();
    })();
    const changed = () => commit();
    c.on("object:modified", changed);
    c.on("object:added", changed);
    c.on("object:removed", changed);
    c.on("text:changed", changed);
    const sel = () => updateSelection();
    c.on("selection:created", sel);
    c.on("selection:updated", sel);
    c.on("selection:cleared", sel);
    c.on("object:moving", sel);
    c.on("object:scaling", sel);
    c.on("object:rotating", sel);
    c.on("object:modified", sel);
    return () => {
      disposed = true;
      c.dispose();
      canvasRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setZoom = useCallback(
    (z: number) => {
      const c = canvasRef.current;
      if (!c) return;
      const zz = Math.min(8, Math.max(0.2, z));
      zoomRef.current = zz;
      setZoomState(zz);
      c.setDimensions({ width: workW * K * zz, height: workH * K * zz });
      c.setZoom(zz);
      c.requestRenderAll();
      updateSelection();
    },
    [workW, workH, updateSelection],
  );

  // ───────── 페이지 ─────────
  const goPage = useCallback(
    async (i: number) => {
      const c = canvasRef.current;
      if (!c || i === pageIndexRef.current || i < 0 || i >= pagesRef.current.length) return;
      pagesRef.current[pageIndexRef.current] = c.toObject();
      pageIndexRef.current = i;
      setPageIndex(i);
      c.discardActiveObject();
      await loadJson(pagesRef.current[i]);
      undoRef.current = [];
      redoRef.current = [];
      lastRef.current = snapshot();
      syncHistoryState();
      updateSelection();
      onChangeRef.current();
    },
    [loadJson, snapshot, updateSelection],
  );

  const addPage = useCallback(async () => {
    const c = canvasRef.current;
    if (!c) return;
    pagesRef.current[pageIndexRef.current] = c.toObject();
    pagesRef.current.push(blankPage());
    setPageCount(pagesRef.current.length);
    await goPage(pagesRef.current.length - 1);
  }, [goPage]);

  const removePage = useCallback(
    async (i: number) => {
      if (pagesRef.current.length <= 1) return;
      const c = canvasRef.current;
      if (c) pagesRef.current[pageIndexRef.current] = c.toObject();
      pagesRef.current.splice(i, 1);
      setPageCount(pagesRef.current.length);
      const next = Math.min(i, pagesRef.current.length - 1);
      pageIndexRef.current = -1; // 강제로 다시 불러오기
      await goPage(next);
    },
    [goPage],
  );

  // ───────── 실행취소 ─────────
  const undo = useCallback(async () => {
    const prev = undoRef.current.pop();
    if (!prev) return;
    redoRef.current.push(lastRef.current);
    lastRef.current = prev;
    await loadJson(JSON.parse(prev));
    pagesRef.current[pageIndexRef.current] = JSON.parse(prev);
    syncHistoryState();
    updateSelection();
    onChangeRef.current();
  }, [loadJson, updateSelection]);

  const redo = useCallback(async () => {
    const next = redoRef.current.pop();
    if (!next) return;
    undoRef.current.push(lastRef.current);
    lastRef.current = next;
    await loadJson(JSON.parse(next));
    pagesRef.current[pageIndexRef.current] = JSON.parse(next);
    syncHistoryState();
    updateSelection();
    onChangeRef.current();
  }, [loadJson, updateSelection]);

  // ───────── 객체 추가 ─────────
  const center = () => ({ left: (workW * K) / 2, top: (workH * K) / 2 });
  const trimW = label.widthMm * K;
  const trimH = label.heightMm * K;

  const place = useCallback((o: FabricObject) => {
    const c = canvasRef.current!;
    c.add(o);
    c.setActiveObject(o);
    c.requestRenderAll();
    updateSelection();
  }, [updateSelection]);

  const addText = useCallback(
    async (kind: "title" | "subtitle" | "body") => {
      const spec = {
        title: { text: "제목을 입력하세요", pt: 16, weight: "bold" },
        subtitle: { text: "부제목을 입력하세요", pt: 11, weight: "normal" },
        body: { text: "본문 내용을 입력하세요", pt: 7.5, weight: "normal" },
      }[kind];
      const t = new Textbox(spec.text, {
        ...center(),
        width: trimW * 0.8,
        fontSize: spec.pt * PT_TO_MM * K,
        fontFamily: "Pretendard Variable",
        fontWeight: spec.weight,
        fill: "#221817",
        textAlign: "center",
        splitByGrapheme: true,
      });
      setMeta(t, { kind: "text" });
      place(t);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [place, trimW],
  );

  /** 이미지 추가. 사진틀이 선택돼 있으면 그 틀 안에 넣는다 */
  const addImage = useCallback(
    async (url: string, kind: "photo" | "sticker" | "ai" = "photo") => {
      const c = canvasRef.current!;
      const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
      const active = c.getActiveObject();
      if (active && metaOf(active).kind === "frame" && kind !== "sticker") {
        fillFrame(c, active, img);
        updateSelection();
        return;
      }
      const max = kind === "sticker" ? Math.min(trimW, trimH) * 0.35 : Math.min(trimW, trimH) * 0.8;
      img.scale(max / Math.max(img.width, img.height));
      img.set(center());
      setMeta(img, { kind });
      place(img);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [place, trimW, trimH, updateSelection],
  );

  const addSvgSticker = useCallback(
    async (url: string) => {
      if (!url.endsWith(".svg")) return addImage(url, "sticker");
      const { objects, options } = await loadSVGFromURL(url);
      const g = util.groupSVGElements(objects.filter(Boolean) as FabricObject[], options);
      const max = Math.min(trimW, trimH) * 0.35;
      g.scale(max / Math.max(g.width ?? 1, g.height ?? 1));
      g.set(center());
      setMeta(g, { kind: "sticker" });
      place(g);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addImage, place, trimW, trimH],
  );

  const addFrame = useCallback(
    (shape: "rect" | "round" | "circle" | "ellipse") => {
      const s = Math.min(trimW, trimH) * 0.6;
      const common = { ...center(), fill: "#e9e9e9", stroke: "#9a9a9a", strokeWidth: 0.4 * K * 0.5, strokeDashArray: [K * 0.8, K * 0.6], strokeUniform: true };
      const o =
        shape === "circle"
          ? new Circle({ ...common, radius: s / 2 })
          : shape === "ellipse"
            ? new Ellipse({ ...common, rx: s * 0.7, ry: s / 2 })
            : new Rect({ ...common, width: s * 1.3, height: s, rx: shape === "round" ? s * 0.15 : 0, ry: shape === "round" ? s * 0.15 : 0 });
      setMeta(o, { kind: "frame", shape });
      place(o);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [place, trimW, trimH],
  );

  const setBackground = useCallback(
    (color: string | null) => {
      const c = canvasRef.current!;
      c.backgroundColor = color ?? "#ffffff";
      c.requestRenderAll();
      commit();
    },
    [commit],
  );

  const applyTemplate = useCallback(
    async (doc: DesignDoc) => {
      const c = canvasRef.current!;
      const { background, objects } = await fitTemplate(doc, label);
      loadingRef.current = true;
      c.clear();
      c.backgroundColor = background;
      objects.forEach((o) => c.add(o));
      loadingRef.current = false;
      c.requestRenderAll();
      await waitFonts(c, () => canvasRef.current === c);
      commit();
      updateSelection();
    },
    [label, commit, updateSelection],
  );

  // ───────── 선택 객체 조작 ─────────
  const active = () => canvasRef.current?.getActiveObject() ?? null;

  const modify = useCallback(
    (fn: (o: FabricObject, c: Canvas) => void) => {
      const c = canvasRef.current;
      const o = c?.getActiveObject();
      if (!c || !o) return;
      fn(o, c);
      o.setCoords();
      c.requestRenderAll();
      commit();
      updateSelection();
    },
    [commit, updateSelection],
  );

  const remove = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.getActiveObjects().forEach((o) => c.remove(o));
    c.discardActiveObject();
    c.requestRenderAll();
    updateSelection();
  }, [updateSelection]);

  const duplicate = useCallback(async () => {
    const c = canvasRef.current;
    const o = c?.getActiveObject();
    if (!c || !o || o.type === "activeselection") return;
    const copy = await o.clone();
    copy.set({ left: (o.left ?? 0) + K * 2, top: (o.top ?? 0) + K * 2 });
    place(copy);
  }, [place]);

  const align = useCallback(
    (dir: "h" | "v") =>
      modify((o) => {
        if (dir === "h") o.set({ left: (workW * K) / 2 });
        else o.set({ top: (workH * K) / 2 });
        o.setCoords();
      }),
    [modify, workW, workH],
  );

  const order = useCallback(
    (dir: "up" | "down") =>
      modify((o, c) => {
        if (dir === "up") c.bringObjectForward(o);
        else c.sendObjectBackwards(o);
      }),
    [modify],
  );

  const toggleLock = useCallback(
    () =>
      modify((o) => {
        const locked = !metaOf(o).locked;
        setMeta(o, { locked });
        applyLock(o, locked);
      }),
    [modify],
  );

  const setBrightness = useCallback(
    (v: number) =>
      modify((o) => {
        if (!(o instanceof FabricImage)) return;
        o.filters = v === 0 ? [] : [new filters.Brightness({ brightness: v })];
        o.applyFilters();
      }),
    [modify],
  );

  /** 자르기: 원본 대비 비율 (0~0.45) */
  const setCrop = useCallback(
    (crop: { l: number; r: number; t: number; b: number }) =>
      modify((o) => {
        if (!(o instanceof FabricImage)) return;
        const el = o.getElement() as HTMLImageElement;
        const W = el.naturalWidth || o.width;
        const H = el.naturalHeight || o.height;
        o.set({ cropX: W * crop.l, cropY: H * crop.t, width: W * (1 - crop.l - crop.r), height: H * (1 - crop.t - crop.b) });
      }),
    [modify],
  );

  const replaceImage = useCallback(
    (url: string) =>
      modify(async (o) => {
        if (!(o instanceof FabricImage)) return;
        const prevW = o.getScaledWidth();
        await o.setSrc(url, { crossOrigin: "anonymous" });
        o.set({ cropX: 0, cropY: 0 });
        o.scale(prevW / o.width);
        canvasRef.current?.requestRenderAll();
        commit();
      }),
    [modify, commit],
  );

  const getDoc = useCallback((): DesignDoc => {
    const c = canvasRef.current;
    if (c) pagesRef.current[pageIndexRef.current] = c.toObject();
    return { v: 1, unit: "mm", k: K, label, pages: structuredClone(pagesRef.current) };
  }, [label]);

  const replaceDoc = useCallback(
    async (doc: DesignDoc) => {
      pagesRef.current = doc.pages.length ? doc.pages : [blankPage()];
      setPageCount(pagesRef.current.length);
      pageIndexRef.current = 0;
      setPageIndex(0);
      await loadJson(pagesRef.current[0]);
      undoRef.current = [];
      redoRef.current = [];
      lastRef.current = snapshot();
      syncHistoryState();
      onChangeRef.current();
    },
    [loadJson, snapshot],
  );

  /** 미리보기용: 현재 페이지 재단 영역을 작은 PNG 로 */
  const trimPreview = useCallback((width: number) => {
    const c = canvasRef.current;
    if (!c) return null;
    const z = zoomRef.current;
    const b = label.bleedMm * K * z;
    // 선택 테두리·핸들은 toDataURL 결과에 들어가지 않는다
    return c.toDataURL({ format: "png", left: b, top: b, width: trimW * z, height: trimH * z, multiplier: width / (trimW * z) });
  }, [label.bleedMm, trimW, trimH]);

  return {
    elRef,
    canvasRef,
    zoom,
    setZoom,
    selection,
    active,
    pageIndex,
    pageCount,
    goPage,
    addPage,
    removePage,
    history: historyState,
    undo,
    redo,
    addText,
    addImage,
    addSvgSticker,
    addFrame,
    setBackground,
    applyTemplate,
    modify,
    remove,
    duplicate,
    align,
    order,
    toggleLock,
    setBrightness,
    setCrop,
    replaceImage,
    getDoc,
    replaceDoc,
    trimPreview,
    commit,
  };
}

function applyLock(o: FabricObject, locked: boolean) {
  o.set({
    lockMovementX: locked,
    lockMovementY: locked,
    lockScalingX: locked,
    lockScalingY: locked,
    lockRotation: locked,
    hasControls: !locked,
    editable: !locked,
  } as Partial<FabricObject>);
}

/** 사진틀 자리에 이미지를 채운다: 틀 모양을 이미지의 clipPath 로 */
function fillFrame(c: Canvas, frame: FabricObject, img: FabricImage) {
  const fw = frame.getScaledWidth();
  const fh = frame.getScaledHeight();
  const scale = Math.max(fw / img.width, fh / img.height);
  img.scale(scale);
  img.set({ left: frame.left, top: frame.top, angle: frame.angle });
  const shape = metaOf(frame).shape ?? "rect";
  const cw = fw / scale;
  const ch = fh / scale;
  const clip =
    shape === "circle"
      ? new Circle({ radius: Math.min(cw, ch) / 2, originX: "center", originY: "center" })
      : shape === "ellipse"
        ? new Ellipse({ rx: cw / 2, ry: ch / 2, originX: "center", originY: "center" })
        : new Rect({ width: cw, height: ch, rx: shape === "round" ? cw * 0.12 : 0, ry: shape === "round" ? cw * 0.12 : 0, originX: "center", originY: "center" });
  img.clipPath = clip;
  setMeta(img, { kind: "framedPhoto", shape });
  const idx = c.getObjects().indexOf(frame);
  c.remove(frame);
  c.insertAt(idx, img);
  c.setActiveObject(img);
  c.requestRenderAll();
}

async function waitFonts(c: Canvas, alive: () => boolean = () => true) {
  const families = new Set<string>();
  c.getObjects().forEach((o) => {
    if (o instanceof Textbox && o.fontFamily) families.add(o.fontFamily);
  });
  await Promise.all([...families].map((f) => document.fonts.load(`16px "${f}"`).catch(() => null)));
  if (!alive()) return;
  c.getObjects().forEach((o) => {
    if (o instanceof Textbox) o.initDimensions();
  });
  c.requestRenderAll();
}
