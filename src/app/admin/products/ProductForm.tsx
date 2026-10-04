"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { Category, ImageRef, LabeledValue } from "@/lib/db/types";
import { btnCls, btnLineCls, Card, inputCls, Label, textareaCls } from "../ui";
import { UploadButton } from "../Upload";
import { saveProductAction, type ProductPayload } from "./actions";

const blank: ProductPayload = {
  slug: "",
  name_en: "",
  name_ko: "",
  category_slugs: [],
  is_visible: false,
  sort_order: 10,
  images: [],
  specs: [{ label: "소재", value: "" }, { label: "중량", value: "" }, { label: "사이즈", value: "" }, { label: "원산지", value: "대한민국" }],
  spec_note: "",
  towel_size: "40×80cm",
  detail_html: "",
  detail_images: [],
  notice_html: "",
  guide_html: "",
  shipping_info: [{ label: "배송방법", value: "택배" }, { label: "배송지역", value: "전국" }, { label: "배송비용", value: "기본 택배비 3,000원" }],
  base_price: 0,
  vat_included: true,
  allow_editor: true,
  allow_upload: true,
  label_width_mm: 65,
  label_height_mm: 45,
  label_bleed_mm: 2,
  label_safe_mm: 3,
  label_corner_mm: 0,
  label_pages: 1,
  allow_pages: false,
  colors: [],
  tiers: [{ min_qty: 1, unit_price: 0 }],
  files: [],
};

export function ProductForm({ categories, initial }: { categories: Category[]; initial: ProductPayload | null }) {
  const router = useRouter();
  const [p, setP] = useState<ProductPayload>(initial ?? blank);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof ProductPayload>(k: K, v: ProductPayload[K]) => setP((x) => ({ ...x, [k]: v }));

  function save() {
    setMsg(null);
    start(async () => {
      const r = await saveProductAction(p);
      if (!r.ok) return setMsg({ ok: false, text: r.error ?? "저장하지 못했습니다." });
      setMsg({ ok: true, text: "저장했습니다." });
      if (!initial) router.replace(`/admin/products/${r.id}`);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-5 pb-24">
      <Card title="기본 정보">
        <div className="grid gap-4 md:grid-cols-3">
          <Label label="영문명"><input className={inputCls} value={p.name_en} onChange={(e) => set("name_en", e.target.value)} /></Label>
          <Label label="한글명"><input className={inputCls} value={p.name_ko} onChange={(e) => set("name_ko", e.target.value)} /></Label>
          <Label label="주소(slug)" hint={`/products/${p.slug || "..."}`}><input className={inputCls} value={p.slug} onChange={(e) => set("slug", e.target.value)} placeholder="lollipop-stripe-towel" /></Label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-5 text-[14px]">
          <span className="text-ink/70">카테고리</span>
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5">
              <input type="checkbox" className="accent-point" checked={p.category_slugs.includes(c.slug)} onChange={(e) => set("category_slugs", e.target.checked ? [...p.category_slugs, c.slug] : p.category_slugs.filter((s) => s !== c.slug))} />
              {c.name}
            </label>
          ))}
          <label className="ml-auto flex items-center gap-1.5"><input type="checkbox" className="accent-point" checked={p.is_visible} onChange={(e) => set("is_visible", e.target.checked)} />사이트에 노출</label>
          <label className="flex items-center gap-1.5">정렬 순서 <input type="number" className={`${inputCls} w-20!`} value={p.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} /></label>
        </div>
      </Card>

      <Card title="제품 사진 (첫 번째 = 목록 썸네일)">
        <ImageList value={p.images} onChange={(v) => set("images", v)} />
      </Card>

      <Card title="스펙 · 안내">
        <Rows value={p.specs} onChange={(v) => set("specs", v)} />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Label label="스펙 아래 안내문"><input className={inputCls} value={p.spec_note} onChange={(e) => set("spec_note", e.target.value)} placeholder="* 수건 박스 별도 문의" /></Label>
          <Label label="수건 사이즈 (도식 표기)"><input className={inputCls} value={p.towel_size} onChange={(e) => set("towel_size", e.target.value)} placeholder="40×80cm" /></Label>
        </div>
        <h3 className="mb-2 mt-5 text-[13px] text-ink/70">배송 안내</h3>
        <Rows value={p.shipping_info} onChange={(v) => set("shipping_info", v)} multiline />
      </Card>

      <Card title="가격">
        <div className="grid gap-4 md:grid-cols-3">
          <Label label="기본 단가 (원)"><input type="number" className={inputCls} value={p.base_price} onChange={(e) => set("base_price", Number(e.target.value))} /></Label>
          <label className="flex items-center gap-2 pt-5 text-[14px]"><input type="checkbox" className="accent-point" checked={p.vat_included} onChange={(e) => set("vat_included", e.target.checked)} />가격에 부가세 포함</label>
        </div>
        <h3 className="mb-2 mt-5 text-[13px] text-ink/70">수량 구간별 단가표</h3>
        <ul className="space-y-2">
          {p.tiers.map((t, i) => (
            <li key={i} className="flex items-center gap-2 text-[14px]">
              <input type="number" className={`${inputCls} w-28!`} value={t.min_qty} onChange={(e) => set("tiers", p.tiers.map((x, j) => (j === i ? { ...x, min_qty: Number(e.target.value) } : x)))} />개 이상
              <input type="number" className={`${inputCls} w-32!`} value={t.unit_price} onChange={(e) => set("tiers", p.tiers.map((x, j) => (j === i ? { ...x, unit_price: Number(e.target.value) } : x)))} />원
              <button type="button" onClick={() => set("tiers", p.tiers.filter((_, j) => j !== i))} aria-label="구간 삭제"><Trash2 size={15} className="text-muted" /></button>
            </li>
          ))}
        </ul>
        <button type="button" className={`${btnLineCls} mt-2`} onClick={() => set("tiers", [...p.tiers, { min_qty: 0, unit_price: 0 }])}><Plus size={14} />구간 추가</button>
      </Card>

      <Card title="라벨 설정 (mm)">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {([["label_width_mm", "재단 가로"], ["label_height_mm", "재단 세로"], ["label_bleed_mm", "도련"], ["label_safe_mm", "안전 여백"], ["label_corner_mm", "모서리 라운드"], ["label_pages", "기본 페이지"]] as const).map(([k, l]) => (
            <Label key={k} label={l}><input type="number" step="0.5" className={inputCls} value={p[k]} onChange={(e) => set(k, Number(e.target.value))} /></Label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-5 text-[14px]">
          <label className="flex items-center gap-1.5"><input type="checkbox" className="accent-point" checked={p.allow_editor} onChange={(e) => set("allow_editor", e.target.checked)} />에디터 편집 허용</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" className="accent-point" checked={p.allow_upload} onChange={(e) => set("allow_upload", e.target.checked)} />PDF 업로드 허용</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" className="accent-point" checked={p.allow_pages} onChange={(e) => set("allow_pages", e.target.checked)} />페이지 추가 허용 (앞/뒷면)</label>
        </div>
      </Card>

      <Card title="색상 옵션 · 목업">
        <p className="mb-3 text-[12.5px] text-muted">목업 사진 위 파란 상자를 끌어 라벨 붙는 위치를 지정합니다. 크기·회전은 옆 칸에서 조절합니다.</p>
        <div className="space-y-4">
          {p.colors.map((c, i) => (
            <ColorRow
              key={c.id ?? i}
              value={c}
              ratio={p.label_height_mm / p.label_width_mm}
              onChange={(v) => set("colors", p.colors.map((x, j) => (j === i ? v : x)))}
              onRemove={() => set("colors", p.colors.filter((_, j) => j !== i))}
              onMove={(d) => {
                const arr = [...p.colors];
                const j = i + d;
                if (j < 0 || j >= arr.length) return;
                [arr[i], arr[j]] = [arr[j], arr[i]];
                set("colors", arr);
              }}
            />
          ))}
        </div>
        <button type="button" className={`${btnLineCls} mt-3`} onClick={() => set("colors", [...p.colors, { name: "", swatch: "#eeeeee", images: [], mockup_url: null, label_x: 90, label_y: 20, label_w: 8, label_rotate: 0 }])}>
          <Plus size={14} />색상 추가
        </button>
      </Card>

      <Card title="제작 가이드 · 도안 파일">
        {(["guide", "template"] as const).map((kind) => {
          const f = p.files.find((x) => x.kind === kind);
          return (
            <div key={kind} className="flex flex-wrap items-center gap-3 py-2 text-[14px]">
              <span className="w-24 text-ink/70">{kind === "guide" ? "제작 가이드" : "도안 파일"}</span>
              {f ? <a href={f.url} className="underline" target="_blank" rel="noreferrer">{f.name}</a> : <span className="text-muted">없음</span>}
              <UploadButton bucket="templates" accept=".pdf,.ai,.eps,.zip,.png,.jpg" label={f ? "바꾸기" : "올리기"} onUploaded={(url, name) => set("files", [...p.files.filter((x) => x.kind !== kind), { kind, name, url }])} />
              {f && <button type="button" className="text-[12.5px] text-muted underline" onClick={() => set("files", p.files.filter((x) => x.kind !== kind))}>삭제</button>}
            </div>
          );
        })}
      </Card>

      <Card title="상세 페이지">
        <h3 className="mb-2 text-[13px] text-ink/70">상세 이미지 (위에서부터 차례로)</h3>
        <ImageList value={p.detail_images} onChange={(v) => set("detail_images", v)} />
        <div className="mt-4 grid gap-4">
          <Label label="상품정보 본문 (HTML 가능)"><textarea rows={4} className={textareaCls} value={p.detail_html} onChange={(e) => set("detail_html", e.target.value)} /></Label>
          <Label label="유의사항 (HTML 가능)"><textarea rows={4} className={textareaCls} value={p.notice_html} onChange={(e) => set("notice_html", e.target.value)} /></Label>
          <Label label="이용안내 (HTML 가능)"><textarea rows={4} className={textareaCls} value={p.guide_html} onChange={(e) => set("guide_html", e.target.value)} /></Label>
        </div>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-end gap-3 border-t border-line bg-white/95 px-5 py-3 backdrop-blur lg:left-52">
        {msg && <span className={`text-[13px] ${msg.ok ? "text-point" : "text-alert"}`}>{msg.text}</span>}
        {initial && <a href={`/products/${p.slug}`} target="_blank" className={btnLineCls} rel="noreferrer">사이트에서 보기</a>}
        <button type="button" onClick={save} disabled={pending} className={btnCls}>{pending ? "저장 중…" : "저장하기"}</button>
      </div>
    </div>
  );
}

function ImageList({ value, onChange }: { value: ImageRef[]; onChange: (v: ImageRef[]) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      {value.map((im, i) => (
        <div key={i} className="w-28">
          <div className="aspect-square overflow-hidden rounded-[6px] border border-line bg-cloud">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {im.url && <img src={im.url} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="mt-1 flex justify-between text-muted">
            <button type="button" aria-label="앞으로" onClick={() => { if (i === 0) return; const a = [...value]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; onChange(a); }}><ArrowUp size={14} className="-rotate-90" /></button>
            <button type="button" aria-label="삭제" onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
            <button type="button" aria-label="뒤로" onClick={() => { if (i === value.length - 1) return; const a = [...value]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; onChange(a); }}><ArrowDown size={14} className="-rotate-90" /></button>
          </div>
        </div>
      ))}
      <div className="grid w-28 place-items-center">
        <UploadButton label="사진 추가" onUploaded={(url) => onChange([...value, { url, alt: "" }])} />
      </div>
    </div>
  );
}

function Rows({ value, onChange, multiline }: { value: LabeledValue[]; onChange: (v: LabeledValue[]) => void; multiline?: boolean }) {
  return (
    <div>
      <ul className="space-y-2">
        {value.map((r, i) => (
          <li key={i} className="flex items-start gap-2">
            <input className={`${inputCls} w-32! shrink-0`} value={r.label} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="항목" />
            {multiline ? (
              <textarea rows={2} className={textareaCls} value={r.value} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
            ) : (
              <input className={inputCls} value={r.value} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} placeholder="내용" />
            )}
            <button type="button" className="mt-2.5" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="항목 삭제"><Trash2 size={15} className="text-muted" /></button>
          </li>
        ))}
      </ul>
      <button type="button" className={`${btnLineCls} mt-2`} onClick={() => onChange([...value, { label: "", value: "" }])}><Plus size={14} />항목 추가</button>
    </div>
  );
}

type ColorValue = ProductPayload["colors"][number];

function ColorRow({ value: c, ratio, onChange, onRemove, onMove }: { value: ColorValue; ratio: number; onChange: (v: ColorValue) => void; onRemove: () => void; onMove: (d: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const drag = (e: React.PointerEvent) => {
    const el = box.current;
    if (!el) return;
    const move = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = Math.min(100, Math.max(0, ((ev.clientX - r.left) / r.width) * 100));
      const y = Math.min(100, Math.max(0, ((ev.clientY - r.top) / r.height) * 100));
      onChange({ ...c, label_x: Math.round(x * 100) / 100, label_y: Math.round(y * 100) / 100 });
    };
    move(e.nativeEvent);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return (
    <div className="grid gap-4 rounded-[8px] border border-line p-4 lg:grid-cols-[280px_1fr]">
      <div>
        {c.mockup_url ? (
          <div ref={box} className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-[6px] bg-cloud" onPointerDown={drag}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.mockup_url} alt="" className="pointer-events-none block w-full" draggable={false} />
            <div
              className="pointer-events-none absolute border-2 border-point bg-point/20"
              style={{ left: `${c.label_x}%`, top: `${c.label_y}%`, width: `${c.label_w}%`, aspectRatio: `1 / ${ratio}`, transform: `translate(-50%, -50%) rotate(${c.label_rotate}deg)` }}
            />
          </div>
        ) : (
          <div className="grid aspect-[2/1] place-items-center rounded-[6px] bg-cloud text-[12px] text-muted">목업 사진 없음</div>
        )}
        <div className="mt-2"><UploadButton bucket="mockups" label={c.mockup_url ? "목업 바꾸기" : "목업 올리기"} onUploaded={(url) => onChange({ ...c, mockup_url: url })} /></div>
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <Label label="색상명"><input className={`${inputCls} w-32!`} value={c.name} onChange={(e) => onChange({ ...c, name: e.target.value })} /></Label>
          <Label label="스와치"><input type="color" className="h-10 w-14 rounded-[6px] border border-line" value={c.swatch} onChange={(e) => onChange({ ...c, swatch: e.target.value })} /></Label>
          <Label label="라벨 X %"><input type="number" step="0.1" className={`${inputCls} w-24!`} value={c.label_x} onChange={(e) => onChange({ ...c, label_x: Number(e.target.value) })} /></Label>
          <Label label="라벨 Y %"><input type="number" step="0.1" className={`${inputCls} w-24!`} value={c.label_y} onChange={(e) => onChange({ ...c, label_y: Number(e.target.value) })} /></Label>
          <Label label="라벨 폭 %"><input type="number" step="0.1" className={`${inputCls} w-24!`} value={c.label_w} onChange={(e) => onChange({ ...c, label_w: Number(e.target.value) })} /></Label>
          <Label label="회전 °"><input type="number" className={`${inputCls} w-20!`} value={c.label_rotate} onChange={(e) => onChange({ ...c, label_rotate: Number(e.target.value) })} /></Label>
          <div className="ml-auto flex gap-2 pb-2 text-muted">
            <button type="button" onClick={() => onMove(-1)} aria-label="위로"><ArrowUp size={16} /></button>
            <button type="button" onClick={() => onMove(1)} aria-label="아래로"><ArrowDown size={16} /></button>
            <button type="button" onClick={onRemove} aria-label="색상 삭제"><Trash2 size={16} /></button>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[13px] text-ink/70">색상별 사진 (첫 번째 = 상세 메인, 두 번째 = 썸네일)</p>
          <ImageList value={c.images} onChange={(v) => onChange({ ...c, images: v })} />
        </div>
      </div>
    </div>
  );
}
