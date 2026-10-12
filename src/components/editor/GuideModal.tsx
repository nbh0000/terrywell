"use client";

import { useEffect } from "react";
import { fmtMm, workSize, type LabelSpec } from "@/lib/editor/types";
import { GUIDE } from "./constants";

// 편집 가이드 모달. 유의사항 문구는 관리자 "사이트 설정"에서 수정한다.
export function GuideModal({ onClose, notes, label }: { onClose: () => void; notes: { title: string; body: string }[]; label: LabelSpec }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const cm = (mm: number) => fmtMm(mm / 10);
  const work = workSize(label);
  const safe = { w: label.widthMm - label.safeMm * 2, h: label.heightMm - label.safeMm * 2 };
  const lines = [
    { color: GUIDE.trim, title: `재단선 ${cm(label.widthMm)}×${cm(label.heightMm)}cm`, desc: "실제 라벨 크기입니다." },
    { color: GUIDE.work, title: `작업 사이즈 ${cm(work.w)}×${cm(work.h)}cm`, desc: "흰 여백 없이 인쇄되도록 배경이 있는 디자인은 보라색 선까지 채워 주세요." },
    { color: GUIDE.safe, title: `안전 영역 ${cm(safe.w)}×${cm(safe.h)}cm`, desc: "글자(문구)와 중요한 이미지는 노란색 선 안쪽에 두세요. 선을 넘으면 인쇄할 때 잘릴 수 있습니다." },
  ];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-5" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="편집 가이드" className="max-h-[90vh] w-full max-w-[400px] overflow-y-auto rounded-[12px] bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="flex items-center gap-2 text-[17px] font-semibold">
          <span className="grid size-6 place-items-center rounded-full bg-point text-[13px] text-white">?</span>편집 가이드
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
          <p className="text-[15px] font-semibold">이미지·PDF·AI·SVG 파일을 불러와 편집할 수 있습니다.</p>
          <span className="mt-3 inline-block rounded-[6px] bg-point px-3 py-1 text-[12px] font-medium text-white">유의 사항</span>
          <ol className="mt-3 space-y-3 text-[13px] leading-relaxed">
            {notes.map((n, i) => (
              <li key={i}>
                <p className="font-medium text-point">{"①②③④⑤⑥⑦⑧⑨"[i] ?? `${i + 1}.`} {n.title}</p>
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
