import Link from "next/link";
import type { Inquiry } from "@/lib/db/types";
import { INQUIRY_STATUS_LABEL } from "@/lib/inquiry";

// 내 1:1 문의 목록 (Q&A, 마이페이지 공용)
export function InquiryList({ items }: { items: Inquiry[] }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13.5px] text-muted">남겨 주신 문의는 운영시간 안에 순서대로 답변드립니다.</p>
        <Link href="/qna/inquiry/new" className="inline-flex h-10 shrink-0 items-center rounded-[6px] bg-ink px-4 text-[14px] text-white hover:bg-ink/85">문의하기</Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-5 border-t border-ink/70 py-16 text-center text-[14px] text-muted">아직 남긴 문의가 없습니다.</p>
      ) : (
        <ul className="mt-5 border-t border-ink/70">
          {items.map((q) => (
            <li key={q.id} className="border-b border-line">
              <Link href={`/qna/inquiry/${q.id}`} className="flex items-center gap-3 py-4 hover:bg-tile/60">
                <span className={`w-[72px] shrink-0 rounded-[4px] px-2 py-0.5 text-center text-[12px] ${q.status === "answered" ? "bg-point/10 text-point" : "bg-tile text-muted"}`}>
                  {INQUIRY_STATUS_LABEL[q.status]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px]">{q.title}</span>
                  <span className="text-[12.5px] text-muted">{q.type}{q.order_no ? ` · 주문번호 ${q.order_no}` : ""}</span>
                </span>
                <span className="shrink-0 text-[12.5px] text-muted">{new Date(q.created_at).toLocaleDateString("ko-KR")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
