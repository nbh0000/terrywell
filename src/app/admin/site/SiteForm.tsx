"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { CompanyInfo, HomeContent } from "@/lib/site";
import { btnCls, Card, inputCls, Label, textareaCls } from "../ui";
import { UploadButton } from "../Upload";
import { saveSiteAction } from "./actions";

interface Data {
  company: CompanyInfo;
  shipping: { fee: number; free_over: number };
  home: HomeContent;
  about: { heading: string[]; image1: string; image2: string; paragraphs: string[][] };
  customLabel: { image: string; title: string; paragraphs: string[][] };
  editorGuide: { notes: { title: string; body: string }[] };
  pdfConsent: { items: string[] };
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
          {([["company_name", "상호"], ["ceo", "대표자명"], ["business_number", "사업자등록번호"], ["mail_order_number", "통신판매업번호"], ["phone", "대표 전화"], ["email", "이메일"], ["address", "사업장 주소"], ["hours_weekday", "운영시간"], ["hours_lunch", "점심시간"]] as const).map(([k, l]) => (
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
        <h3 className="mb-2 text-[13px] font-medium">히어로</h3>
        <div className="grid gap-3 md:grid-cols-[200px_1fr_1fr]">
          <ImageField value={d.home.hero.image} onChange={(v) => set("home", { ...d.home, hero: { ...d.home.hero, image: v } })} />
          <Label label="제목"><input className={inputCls} value={d.home.hero.title} onChange={(e) => set("home", { ...d.home, hero: { ...d.home.hero, title: e.target.value } })} /></Label>
          <Label label="슬로건"><input className={inputCls} value={d.home.hero.slogan} onChange={(e) => set("home", { ...d.home, hero: { ...d.home.hero, slogan: e.target.value } })} /></Label>
        </div>
        <h3 className="mb-2 mt-5 text-[13px] font-medium">카드 4개</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {d.home.cards.map((c, i) => {
            const upd = (v: Partial<typeof c>) => set("home", { ...d.home, cards: d.home.cards.map((x, j) => (j === i ? { ...x, ...v } : x)) });
            return (
              <div key={i} className="space-y-2 rounded-[8px] border border-line p-3">
                <ImageField value={c.image} onChange={(v) => upd({ image: v })} />
                <input className={inputCls} value={c.title} onChange={(e) => upd({ title: e.target.value })} aria-label="카드 제목" />
                <input className={inputCls} value={c.subtitle} onChange={(e) => upd({ subtitle: e.target.value })} aria-label="카드 부제" />
                <input className={inputCls} value={c.href} onChange={(e) => upd({ href: e.target.value })} aria-label="연결 주소" placeholder="/products" />
              </div>
            );
          })}
        </div>
        <h3 className="mb-2 mt-5 text-[13px] font-medium">신제품 배너</h3>
        <div className="grid gap-3 md:grid-cols-[200px_1fr_1fr]">
          <ImageField value={d.home.banner.image} onChange={(v) => set("home", { ...d.home, banner: { ...d.home.banner, image: v } })} />
          <div className="space-y-2">
            <Label label="제목"><input className={inputCls} value={d.home.banner.title} onChange={(e) => set("home", { ...d.home, banner: { ...d.home.banner, title: e.target.value } })} /></Label>
            <Label label="뱃지"><input className={inputCls} value={d.home.banner.badge} onChange={(e) => set("home", { ...d.home, banner: { ...d.home.banner, badge: e.target.value } })} /></Label>
          </div>
          <div className="space-y-2">
            <Label label="버튼 문구"><input className={inputCls} value={d.home.banner.button} onChange={(e) => set("home", { ...d.home, banner: { ...d.home.banner, button: e.target.value } })} /></Label>
            <Label label="연결 주소"><input className={inputCls} value={d.home.banner.href} onChange={(e) => set("home", { ...d.home, banner: { ...d.home.banner, href: e.target.value } })} /></Label>
          </div>
        </div>
      </Section>

      <Section title="회사 소개" onSave={() => saveSiteAction("about", d.about)}>
        <div className="grid gap-3 md:grid-cols-[200px_200px_1fr]">
          <ImageField label="사진 1 (Better 옆)" value={d.about.image1} onChange={(v) => set("about", { ...d.about, image1: v ?? "" })} />
          <ImageField label="사진 2 (본문 옆)" value={d.about.image2} onChange={(v) => set("about", { ...d.about, image2: v ?? "" })} />
          <Label label="큰 제목 (줄마다 한 단어)"><textarea rows={3} className={textareaCls} value={d.about.heading.join("\n")} onChange={(e) => set("about", { ...d.about, heading: e.target.value.split("\n") })} /></Label>
        </div>
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
