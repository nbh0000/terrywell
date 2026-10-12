"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ChevronDown, Paperclip, X } from "lucide-react";
import { FormMessage, SubmitButton } from "@/components/form";
import { INQUIRY_TYPES } from "@/lib/inquiry";
import { createInquiryAction } from "../actions";

const inputCls = "h-12 w-full rounded-[6px] border border-line bg-paper px-3.5 text-[15px] outline-none focus:border-ink/50";

// 1) 문의 유형을 고르면 관련 자주 묻는 질문을 먼저 보여 주고 2) 주문번호·제목·내용·첨부로 문의를 남긴다
export function InquiryForm({ orders, faqs, initialOrderNo }: { orders: { no: string; date: string }[]; faqs: { id: string; category: string; question: string; answer: string }[]; initialOrderNo: string }) {
  const [state, action] = useActionState(createInquiryAction, undefined);
  const [type, setType] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  if (state?.ok) {
    return (
      <div className="rounded-[10px] border border-line px-6 py-14 text-center">
        <p className="text-[17px] font-medium">문의가 접수되었습니다.</p>
        <p className="mt-1.5 text-[14px] text-muted">답변이 등록되면 1:1 문의와 마이페이지에서 확인할 수 있습니다.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href={`/qna/inquiry/${state.id}`} className="inline-flex h-11 items-center rounded-[6px] bg-ink px-6 text-[14px] text-white">문의 내용 보기</Link>
          <Link href="/qna/inquiry" className="inline-flex h-11 items-center rounded-[6px] border border-line px-5 text-[14px]">내 문의 목록</Link>
        </div>
      </div>
    );
  }

  const faqCat = INQUIRY_TYPES.find((t) => t.label === type)?.faq ?? null;
  const related = faqCat ? faqs.filter((f) => f.category === faqCat).slice(0, 5) : [];

  return (
    <form
      action={(fd) => {
        fd.delete("files");
        files.forEach((f) => fd.append("files", f));
        fd.set("type", type);
        return action(fd);
      }}
      className="space-y-6"
    >
      <fieldset>
        <legend className="mb-2.5 text-[14px] font-medium">무엇이 궁금하신가요?</legend>
        <div className="flex flex-wrap gap-2">
          {INQUIRY_TYPES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setType(t.label)}
              aria-pressed={type === t.label}
              className={`rounded-[6px] border px-3.5 py-2 text-[13.5px] transition-colors ${type === t.label ? "border-point bg-point text-white" : "border-line bg-white text-ink hover:border-point/60"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      {related.length > 0 && (
        <div className="rounded-[10px] bg-tile p-4">
          <p className="mb-2 text-[13px] text-muted">이런 질문이 많아요. 먼저 확인해 보세요.</p>
          <ul className="divide-y divide-line/70">
            {related.map((f) => (
              <li key={f.id}>
                <button type="button" onClick={() => setOpen(open === f.id ? null : f.id)} aria-expanded={open === f.id} className="flex w-full items-center gap-2 py-2.5 text-left text-[14px]">
                  <span className="font-display text-[12px] font-semibold text-point">Q</span>
                  <span className="flex-1">{f.question}</span>
                  <ChevronDown size={16} className={`text-muted transition-transform ${open === f.id ? "rotate-180" : ""}`} />
                </button>
                {open === f.id && <div className="prose-tw pb-3 pl-5 text-[13.5px]" dangerouslySetInnerHTML={{ __html: f.answer }} />}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`space-y-4 transition-opacity ${type ? "" : "pointer-events-none opacity-40"}`} aria-disabled={!type}>
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-ink/80">주문번호 <span className="text-muted">(주문 관련 문의일 때)</span></span>
          {orders.length ? (
            <select name="order_no" defaultValue={initialOrderNo} className={inputCls}>
              <option value="">선택 안 함</option>
              {orders.map((o) => (
                <option key={o.no} value={o.no}>{o.no} ({o.date})</option>
              ))}
            </select>
          ) : (
            <input name="order_no" defaultValue={initialOrderNo} placeholder="주문번호가 있으면 적어 주세요" className={inputCls} />
          )}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-ink/80">문의 제목<span className="ml-0.5 text-point">*</span></span>
          <input name="title" required maxLength={120} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-ink/80">문의 내용<span className="ml-0.5 text-point">*</span></span>
          <textarea name="body" required rows={8} maxLength={5000} className="w-full rounded-[6px] border border-line bg-paper p-3.5 text-[15px] outline-none focus:border-ink/50" />
        </label>
        <div>
          <span className="mb-1.5 block text-[13px] text-ink/80">파일 첨부 <span className="text-muted">(사진·파일 최대 5개, 파일당 20MB)</span></span>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] border border-ink/70 px-4 py-2.5 text-[14px]">
            <Paperclip size={15} /> 파일 선택
            <input
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                setFiles((prev) => [...prev, ...picked].slice(0, 5));
                e.target.value = "";
              }}
            />
          </label>
          {files.length > 0 && (
            <ul className="mt-2 space-y-1 text-[13px]">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="truncate">{f.name}</span>
                  <span className="shrink-0 text-muted">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                  <button type="button" aria-label="첨부 삭제" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}><X size={14} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <FormMessage error={state?.error} />
        <SubmitButton className="sm:w-[240px]">문의 남기기</SubmitButton>
      </div>
      {!type && <p className="text-[13px] text-muted">문의 유형을 먼저 골라 주세요.</p>}
    </form>
  );
}
