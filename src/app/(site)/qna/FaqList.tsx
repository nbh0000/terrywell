"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";

interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
}

// 검색 + 분류 탭 + 펼치는 목록. 원하는 답이 없으면 1:1 문의로
export function FaqList({ faqs }: { faqs: Faq[] }) {
  const cats = ["전체", ...Array.from(new Set(faqs.map((f) => f.category)))];
  const [cat, setCat] = useState("전체");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const query = q.trim().toLowerCase();
  const strip = (h: string) => h.replace(/<[^>]+>/g, " ");
  const list = faqs.filter((f) => (cat === "전체" || f.category === cat) && (!query || `${f.question} ${strip(f.answer)}`.toLowerCase().includes(query)));

  return (
    <div>
      <form role="search" onSubmit={(e) => e.preventDefault()} className="flex h-12 items-center gap-2 rounded-[8px] border border-line bg-white px-4 focus-within:border-ink/40">
        <Search size={17} strokeWidth={1.6} className="text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="궁금한 내용을 검색해 보세요" aria-label="자주 묻는 질문 검색" className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted/70" />
      </form>

      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="질문 분류">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={cat === c}
            onClick={() => setCat(c)}
            className={`rounded-[6px] border px-3.5 py-1.5 text-[13.5px] transition-colors ${cat === c ? "border-point bg-point/[0.06] text-point" : "border-line text-ink/70 hover:border-ink/30"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mt-6 border-t border-ink/70 py-16 text-center text-[14px] text-muted">
          찾는 질문이 없습니다. <Link href="/qna/inquiry/new" className="text-ink underline">1:1 문의</Link>로 남겨 주세요.
        </p>
      ) : (
        <ul className="mt-6 border-t border-ink/70">
          {list.map((f) => {
            const isOpen = open === f.id;
            return (
              <li key={f.id} className="border-b border-line">
                <button type="button" onClick={() => setOpen(isOpen ? null : f.id)} aria-expanded={isOpen} className="flex w-full items-center gap-3 py-4 text-left text-[15px]">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-point/10 font-display text-[12px] font-semibold text-point">Q</span>
                  <span className="flex-1">{f.question}</span>
                  <ChevronDown size={18} className={`shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="mb-4 ml-9 rounded-[8px] bg-tile px-4 py-3.5">
                    <div className="prose-tw text-[14px]" dangerouslySetInnerHTML={{ __html: f.answer }} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10 flex flex-col items-start justify-between gap-3 rounded-[10px] border border-line p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-[15px] font-medium">원하는 답을 찾지 못하셨나요?</p>
          <p className="mt-0.5 text-[13px] text-muted">1:1 문의를 남겨 주시면 운영시간 안에 순서대로 답변드립니다.</p>
        </div>
        <Link href="/qna/inquiry/new" className="inline-flex h-11 shrink-0 items-center rounded-[6px] bg-ink px-5 text-[14px] text-white hover:bg-ink/85">1:1 문의하기</Link>
      </div>
    </div>
  );
}
