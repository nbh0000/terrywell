"use client";

import type { LabelSpec } from "@/lib/editor/types";
import type { EditorColor } from "./Editor";

/**
 * 수건 목업 위에 라벨을 얹은 실시간 미리보기.
 * 라벨 위치·크기·회전은 제품 색상별 설정(관리자에서 지정)을 따른다.
 */
export function MockupPreview({ color, labelUrl, label }: { color: EditorColor | null; labelUrl: string | null; label: LabelSpec }) {
  const m = color?.mockup;
  const ratio = label.heightMm / label.widthMm;
  if (!m?.url) {
    // 목업 사진이 없는 제품: 라벨만 크게
    return (
      <div className="grid place-items-center rounded-[8px] bg-[#f3f3f1] p-8">
        <div className="w-full bg-white shadow-sm" style={{ aspectRatio: `${label.widthMm} / ${label.heightMm}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {labelUrl && <img src={labelUrl} alt="라벨 미리보기" className="h-full w-full" />}
        </div>
      </div>
    );
  }
  const scene = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.url} alt={`${color?.name ?? ""} 수건`} className="block w-full" />
      {labelUrl && (
        <div
          className="absolute"
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: `${m.w}%`,
            aspectRatio: `1 / ${ratio}`,
            transform: `translate(-50%, -50%) rotate(${m.rotate}deg)`,
          }}
        >
          {/* 원단 라벨 느낌: 흰 바탕 + 살짝 그림자, 디자인은 multiply 로 얹는다 */}
          <div className="absolute inset-0 bg-white shadow-[0_0_1.5px_rgba(0,0,0,0.25)]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {labelUrl && <img src={labelUrl} alt="라벨 미리보기" className="absolute inset-0 h-full w-full mix-blend-multiply" />}
        </div>
      )}
    </>
  );
  // 라벨은 수건에 비해 작아서, 라벨 주변을 확대한 화면을 함께 보여 준다
  const zoom = Math.min(6, 38 / Math.max(1, m.w));
  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-[8px] bg-[#f3f3f1]">{scene}</div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] bg-[#f3f3f1]">
        {/* 확대한 목업의 라벨 중심을 상자 가운데에 맞춘다 (translate % 는 자기 크기 기준) */}
        <div className="absolute left-1/2 top-1/2" style={{ width: `${zoom * 100}%`, transform: `translate(-${m.x}%, -${m.y}%)` }}>
          <div className="relative">{scene}</div>
        </div>
        <span className="absolute bottom-2 left-2 rounded-full bg-white/85 px-2 py-0.5 text-[11px] text-muted">라벨 확대</span>
      </div>
    </div>
  );
}
