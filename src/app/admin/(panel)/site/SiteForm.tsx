"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { CompanyInfo, HomeContent, HomeSlide } from "@/lib/site";
import { btnCls, Card, inputCls, Label, textareaCls } from "../ui";
import { UploadButton } from "../Upload";
import { saveSiteAction } from "./actions";

interface Data {
  company: CompanyInfo;
  shipping: { fee: number; free_over: number };
  home: HomeContent;
  products: { new_days: number };
  mixNotice: { lines: string[] };
  about: { intro: string[][]; heading: string[]; image1: string; image2: string; paragraphs: string[][] };
  customLabel: { image: string; title: string; paragraphs: string[][] };
  editorGuide: { notes: { title: string; body: string }[] };
  pdfConsent: { items: string[] };
  legal: { terms: string; privacy: string };
}

// 문단 = 빈 줄로 구분, 문단 안 줄바꿈 = 화면 줄바꿈
const toText = (ps: string[][]) => ps.map((p) => p.join("\n")).join("\n\n");
const fromText = (t: string) => t.split(/\n\s*\n/).map((p) => p.split("\n").map((l) => l.trim()).filter(Boolean)).filter((p) => p.length);

export function SiteForm({ initial }: { initial: Data }) {
  const [d, setD] = useState(initial);
  const set = <K extends keyof Data>(k: K, v: Data[K]) => setD((x) => ({ ...x, [k]: v }));

  return (
    <div className="space-y-5">
      <Section title="사업자 정보 (푸터)" onSave={() => saveSiteAction("company", d.company)}>
        <div className="grid gap-3 md:grid-cols-3">
          {([["company_name", "상호"], ["ceo", "대표자명"], ["business_number", "사업자등록번호"], ["mail_order_number", "통신판매업번호 (비우면 표시 안 함)"], ["phone", "대표 전화"], ["email", "이메일"], ["address", "사업장 주소"], ["hours_weekday", "운영시간"], ["hours_lunch", "점심시간"], ["instagram", "인스타그램 주소"]] as const).map(([k, l]) => (
            <Label key={k} label={l}><input className={inputCls} value={d.company[k]} onChange={(e) => set("company", { ...d.company, [k]: e.target.value })} /></Label>
          ))}
        </div>
      </Section>

      <Section title="배송비" onSave={() => saveSiteAction("shipping", d.shipping)}>
        <div className="grid gap-3 md:grid-cols-3">
          <Label label="기본 배송비 (원)"><input type="number" className={inputCls} value={d.shipping.fee} onChange={(e) => set("shipping", { ...d.shipping, fee: Number(e.target.value) })} /></Label>
          <Label label="무료배송 기준 금액 (원)" hint="0 이면 무료배송 없음"><input type="number" className={inputCls} value={d.shipping.free_over} onChange={(e) => set("shipping", { ...d.shipping, free_over: Number(e.target.value) })} /></Label>
        </div>
      </Section>

      <Section title="메인 화면" onSave={() => saveSiteAction("home", d.home)}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="text-[13px] font-medium">넘어가는 슬라이드 <span className="font-normal text-muted">(위에서부터 차례로 보입니다)</span></h3>
          <Label label="넘어가는 간격 (초)"><input type="number" min={2} className={`${inputCls} w-24!`} value={d.home.interval_sec} onChange={(e) => set("home", { ...d.home, interval_sec: Number(e.target.value) })} /></Label>
        </div>
        <div className="mt-3 space-y-3">
          {d.home.slides.map((sl, i) => {
            const upd = (v: Partial<HomeSlide>) => set("home", { ...d.home, slides: d.home.slides.map((x, j) => (j === i ? { ...x, ...v } : x)) });
            const move = (dir: -1 | 1) => {
              const arr = [...d.home.slides];
              const j = i + dir;
              if (j < 0 || j >= arr.length) return;
              [arr[i], arr[j]] = [arr[j], arr[i]];
              set("home", { ...d.home, slides: arr });
            };
            return (
              <div key={i} className="grid gap-3 rounded-[8px] border border-line p-3 md:grid-cols-[180px_1fr]">
                <ImageField label={`${i + 1}번 이미지`} value={sl.image} onChange={(v) => upd({ image: v })} />
                <div className="grid content-start gap-2 md:grid-cols-2">
                  <Label label="모양">
                    <select className={inputCls} value={sl.style} onChange={(e) => upd({ style: e.target.value as HomeSlide["style"] })}>
                      <option value="brand">브랜드형 (파란 큰 글자)</option>
                      <option value="product">제품형 (흰 글자 + 버튼)</option>
                    </select>
                  </Label>
                  <Label label="누르면 이동할 주소" hint="예) /products/lollipop-stripe-towel, https://..."><input className={inputCls} value={sl.href} onChange={(e) => upd({ href: e.target.value })} /></Label>
                  <Label label="제목"><input className={inputCls} value={sl.title} onChange={(e) => upd({ title: e.target.value })} /></Label>
                  <Label label="작은 글"><input className={inputCls} value={sl.subtitle} onChange={(e) => upd({ subtitle: e.target.value })} /></Label>
                  <Label label="뱃지 (제품형, 비우면 없음)"><input className={inputCls} value={sl.badge} onChange={(e) => upd({ badge: e.target.value })} /></Label>
                  <Label label="버튼 문구 (제품형, 비우면 없음)"><input className={inputCls} value={sl.button} onChange={(e) => upd({ button: e.target.value })} /></Label>
                  <Label label="보이기 시작하는 날" hint="비우면 바로"><input type="date" className={inputCls} value={sl.start} onChange={(e) => upd({ start: e.target.value })} /></Label>
                  <Label label="내리는 날 (이날까지 보임)" hint="비우면 계속"><input type="date" className={inputCls} value={sl.end} onChange={(e) => upd({ end: e.target.value })} /></Label>
                  <div className="flex gap-3 text-[13px] md:col-span-2">
                    <button type="button" className="underline disabled:opacity-30" disabled={i === 0} onClick={() => move(-1)}>위로</button>
                    <button type="button" className="underline disabled:opacity-30" disabled={i === d.home.slides.length - 1} onClick={() => move(1)}>아래로</button>
                    <button type="button" className="ml-auto text-alert underline" onClick={() => set("home", { ...d.home, slides: d.home.slides.filter((_, j) => j !== i) })}>이 슬라이드 삭제</button>
                  </div>
                </div>
              </div>
            );
          })}
          <button
            type="button"
            className="text-[13px] underline"
            onClick={() => set("home", { ...d.home, slides: [...d.home.slides, { image: null, style: "product", title: "", subtitle: "", badge: "", button: "바로가기", href: "/products", start: "", end: "" }] })}
          >
            슬라이드 추가
          </button>
        </div>

        <h3 className="mb-2 mt-6 text-[13px] font-medium">제품 바로가기</h3>
        <Label label="제목"><input className={`${inputCls} max-w-xs`} value={d.home.products_title} onChange={(e) => set("home", { ...d.home, products_title: e.target.value })} /></Label>
        <p className="mt-1 text-[12px] text-muted">노출 중인 제품이 색상별로 자동으로 나옵니다.</p>

        <h3 className="mb-2 mt-6 text-[13px] font-medium">브랜드 소개 이미지 (마우스를 올리면 어두워지며 글자 표시)</h3>
        <div className="grid gap-3 md:grid-cols-[180px_1fr_1fr_1fr]">
          <ImageField value={d.home.brand.image} onChange={(v) => set("home", { ...d.home, brand: { ...d.home.brand, image: v } })} />
          <Label label="큰 글자"><input className={inputCls} value={d.home.brand.label} onChange={(e) => set("home", { ...d.home, brand: { ...d.home.brand, label: e.target.value } })} /></Label>
          <Label label="작은 글"><input className={inputCls} value={d.home.brand.caption} onChange={(e) => set("home", { ...d.home, brand: { ...d.home.brand, caption: e.target.value } })} /></Label>
          <Label label="연결 주소"><input className={inputCls} value={d.home.brand.href} onChange={(e) => set("home", { ...d.home, brand: { ...d.home.brand, href: e.target.value } })} /></Label>
        </div>
      </Section>

      <Section title="제품 NEW 표시" onSave={() => saveSiteAction("products", d.products)}>
        <Label label="NEW 표시 기간 (일)" hint="제품 출시일부터 이 기간 동안 NEW 가 붙고, 지나면 자동으로 사라집니다. 출시일은 제품 관리에서 정합니다.">
          <input type="number" min={0} className={`${inputCls} w-28!`} value={d.products.new_days} onChange={(e) => set("products", { new_days: Number(e.target.value) })} />
        </Label>
      </Section>

      <Section title="혼합 색상 안내 문구" onSave={() => saveSiteAction("mixNotice", d.mixNotice)}>
        <Label label="줄마다 한 줄 (첫 줄은 굵게)"><textarea rows={4} className={textareaCls} value={d.mixNotice.lines.join("\n")} onChange={(e) => set("mixNotice", { lines: e.target.value.split("\n") })} /></Label>
      </Section>

      <Section title="회사 소개" onSave={() => saveSiteAction("about", d.about)}>
        <div className="grid gap-3 md:grid-cols-[200px_200px_1fr]">
          <ImageField label="사진 1 (Better 옆)" value={d.about.image1} onChange={(v) => set("about", { ...d.about, image1: v ?? "" })} />
          <ImageField label="사진 2 (본문 옆)" value={d.about.image2} onChange={(v) => set("about", { ...d.about, image2: v ?? "" })} />
          <Label label="큰 제목 (줄마다 한 단어)"><textarea rows={3} className={textareaCls} value={d.about.heading.join("\n")} onChange={(e) => set("about", { ...d.about, heading: e.target.value.split("\n") })} /></Label>
        </div>
        <Label label="맨 위 로고 옆 문구 (빈 줄로 문단 구분, 첫 문단은 굵게)"><textarea rows={7} className={`${textareaCls} mt-3`} value={toText(d.about.intro)} onChange={(e) => set("about", { ...d.about, intro: fromText(e.target.value) })} /></Label>
        <Label label="본문 (빈 줄로 문단 구분)"><textarea rows={12} className={`${textareaCls} mt-3`} value={toText(d.about.paragraphs)} onChange={(e) => set("about", { ...d.about, paragraphs: fromText(e.target.value) })} /></Label>
      </Section>

      <Section title="커스텀 라벨 페이지" onSave={() => saveSiteAction("customLabel", d.customLabel)}>
        <div className="grid gap-3 md:grid-cols-[200px_1fr]">
          <ImageField value={d.customLabel.image} onChange={(v) => set("customLabel", { ...d.customLabel, image: v ?? "" })} />
          <div className="space-y-2">
            <Label label="제목"><input className={inputCls} value={d.customLabel.title} onChange={(e) => set("customLabel", { ...d.customLabel, title: e.target.value })} /></Label>
            <Label label="본문 (빈 줄로 문단 구분)"><textarea rows={9} className={textareaCls} value={toText(d.customLabel.paragraphs)} onChange={(e) => set("customLabel", { ...d.customLabel, paragraphs: fromText(e.target.value) })} /></Label>
          </div>
        </div>
      </Section>

      <Section title="에디터 편집 가이드 유의사항" onSave={() => saveSiteAction("editorGuide", d.editorGuide)}>
        <div className="space-y-3">
          {d.editorGuide.notes.map((n, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-[260px_1fr_auto]">
              <input className={inputCls} value={n.title} onChange={(e) => set("editorGuide", { notes: d.editorGuide.notes.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} aria-label="제목" />
              <textarea rows={2} className={textareaCls} value={n.body} onChange={(e) => set("editorGuide", { notes: d.editorGuide.notes.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })} aria-label="내용" />
              <button type="button" className="text-[13px] text-muted underline" onClick={() => set("editorGuide", { notes: d.editorGuide.notes.filter((_, j) => j !== i) })}>삭제</button>
            </div>
          ))}
          <button type="button" className="text-[13px] underline" onClick={() => set("editorGuide", { notes: [...d.editorGuide.notes, { title: "", body: "" }] })}>항목 추가</button>
        </div>
      </Section>

      <Section title="PDF 업로드 필수 동의 문구" onSave={() => saveSiteAction("pdfConsent", d.pdfConsent)}>
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <textarea key={i} rows={2} className={textareaCls} value={d.pdfConsent.items[i] ?? ""} onChange={(e) => set("pdfConsent", { items: [0, 1].map((j) => (j === i ? e.target.value : d.pdfConsent.items[j] ?? "")) })} aria-label={`동의 ${i + 1}`} />
          ))}
        </div>
      </Section>
      <Section title="이용약관 · 개인정보처리방침 (HTML)" onSave={() => saveSiteAction("legal", d.legal)}>
        <p className="mb-2 text-[12.5px] text-alert">기본값은 사이트 기능 기준 초안입니다. 실제 내용은 고객사 확인 후 확정해 주세요.</p>
        <div className="grid gap-3 xl:grid-cols-2">
          <Label label="이용약관"><textarea rows={14} className={textareaCls} value={d.legal.terms} onChange={(e) => set("legal", { ...d.legal, terms: e.target.value })} /></Label>
          <Label label="개인정보처리방침"><textarea rows={14} className={textareaCls} value={d.legal.privacy} onChange={(e) => set("legal", { ...d.legal, privacy: e.target.value })} /></Label>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children, onSave }: { title: string; children: ReactNode; onSave: () => Promise<{ ok: boolean; error?: string }> }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <Card title={title}>
      {children}
      <div className="mt-4 flex items-center gap-3">
        <button type="button" className={btnCls} disabled={pending} onClick={() => start(async () => { const r = await onSave(); setMsg(r.ok ? "저장했습니다." : r.error ?? "저장하지 못했습니다."); })}>
          {pending ? "저장 중…" : "저장"}
        </button>
        {msg && <span className="text-[13px] text-muted">{msg}</span>}
      </div>
    </Card>
  );
}

function ImageField({ value, onChange, label = "이미지" }: { value: string | null; onChange: (v: string | null) => void; label?: string }) {
  return (
    <div>
      <p className="mb-1 text-[13px] text-ink/70">{label}</p>
      <div className="aspect-[4/3] overflow-hidden rounded-[6px] border border-line bg-cloud">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value && <img src={value} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="mt-1.5"><UploadButton label="바꾸기" onUploaded={(url) => onChange(url)} /></div>
    </div>
  );
}
