"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { submitQuoteAction } from "./actions";

export function QuoteForm({ products, defaults }: { products: string[]; defaults: { company: string; name: string; phone: string; email: string; product: string } }) {
  const [state, action] = useActionState(submitQuoteAction, undefined);
  const [files, setFiles] = useState<File[]>([]);

  if (state?.ok) {
    return (
      <div className="mt-10 border-y border-line py-16 text-center">
        <p className="text-[18px] font-medium">견적문의가 접수되었습니다.</p>
        <p className="mt-2 text-[14px] text-muted">남겨 주신 연락처로 안내드리겠습니다.</p>
        <Link href="/products" className="mt-8 inline-flex h-12 items-center bg-ink px-8 text-[15px] text-white">제품 보러 가기</Link>
      </div>
    );
  }

  return (
    <form
      action={(fd) => {
        fd.delete("files");
        files.forEach((f) => fd.append("files", f));
        return action(fd);
      }}
      className="mt-10 space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="회사명" name="company" defaultValue={defaults.company} autoComplete="organization" />
        <Field label="이름" name="name" defaultValue={defaults.name} required autoComplete="name" />
        <Field label="연락처" name="phone" type="tel" defaultValue={defaults.phone} required placeholder="010-0000-0000" autoComplete="tel" />
        <Field label="이메일" name="email" type="email" defaultValue={defaults.email} required autoComplete="email" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-ink/80">제품</span>
          <select name="product" defaultValue={defaults.product} className="h-12 w-full rounded-[3px] border border-line bg-paper px-3 text-[15px] outline-none focus:border-ink/50">
            <option value="">선택해 주세요</option>
            {products.map((p) => <option key={p}>{p}</option>)}
            <option>커스텀 라벨 (기타)</option>
          </select>
        </label>
        <Field label="예상 수량" name="quantity" inputMode="numeric" placeholder="예) 300" />
        <Field label="희망 납기" name="due_date" type="date" />
      </div>
      <label className="block">
        <span className="mb-1.5 block text-[13px] text-ink/80">문의 내용</span>
        <textarea name="message" rows={7} maxLength={3000} className="w-full rounded-[3px] border border-line bg-paper p-3.5 text-[15px] outline-none focus:border-ink/50" placeholder="라벨에 넣을 내용, 수건 색상, 포장 방식 등을 적어 주세요." />
      </label>
      <div>
        <span className="mb-1.5 block text-[13px] text-ink/80">파일 첨부 <span className="text-muted">(최대 5개, 파일당 20MB)</span></span>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-ink px-4 py-2.5 text-[14px]">
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
      <label className="flex items-center gap-2.5 border-t border-line pt-5 text-[14px]">
        <input type="checkbox" name="agree" className="size-4 accent-point" />
        [필수] 문의 처리를 위한 개인정보 수집·이용에 동의합니다.
        <Link href="/privacy" className="text-[12px] text-muted underline">보기</Link>
      </label>
      <FormMessage error={state?.error} />
      <SubmitButton className="sm:w-[260px]">문의 보내기</SubmitButton>
    </form>
  );
}
