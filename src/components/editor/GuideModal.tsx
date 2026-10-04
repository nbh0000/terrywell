"use client";

import { useEffect } from "react";
import { GUIDE } from "./constants";

// 레퍼런스(03) "편집 가이드" 모달. 유의사항 문구는 관리자 "사이트 설정"에서 수정한다.
export function GuideModal({ onClose, notes }: { onClose: () => void; notes: { title: string; body: string }[] }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const lines = [
    { color: GUIDE.trim, title: "재단선", desc: "실제 제작되는 제품 사이즈(재단선)입니다." },
    { color: GUIDE.work, title: "작업 사이즈", desc: "배경이 있는 디자인은 보라색 선까지 이미지를 채워주세요." },
    { color: GUIDE.safe, title: "안전 영역", desc: "재단시 중요한 텍스트나 이미지는 잘려 나가지 않도록 노란색 선 안쪽으로 편집해 주세요." },
  ];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#323433]/90 p-5" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="편집 가이드" className="max-h-[90vh] w-full max-w-[400px] overflow-y-auto bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="flex items-center gap-2 text-[17px] font-semibold">
          <span className="grid size-6 place-items-center rounded-full bg-ink text-[13px] text-white">?</span>편집 가이드
        </h2>
        <ul className="mt-5 space-y-4">
          {lines.map((l) => (
            <li key={l.title}>
              <div className="flex items-center gap-2 text-[14px] font-medium">
                <span className="block h-[3px] w-5 rounded-full" style={{ background: l.color }} />
                {l.title}
              </div>
              <p className="mt-1 pl-7 text-[13px] leading-relaxed text-muted">{l.desc}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-line pt-5">
          <p className="text-[15px] font-semibold">이미지와 PDF 파일 편집이 가능합니다!</p>
          <span className="mt-3 inline-block rounded-full bg-alert px-3 py-1 text-[12px] font-medium text-white">유의 사항</span>
          <ol className="mt-3 space-y-3 text-[13px] leading-relaxed">
            {notes.map((n, i) => (
              <li key={i}>
                <p className="font-medium text-alert">{"①②③④⑤⑥⑦⑧⑨"[i] ?? `${i + 1}.`} {n.title}</p>
                <p className="text-muted">{n.body}</p>
              </li>
            ))}
          </ol>
        </div>
        <button type="button" onClick={onClose} className="mt-6 h-11 w-full rounded-[6px] bg-ink text-[15px] text-white">확인</button>
      </div>
    </div>
  );
}
