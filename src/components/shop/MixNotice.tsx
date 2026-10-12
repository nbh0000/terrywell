import { Info } from "lucide-react";

/** 혼합 색상 안내 (관리자 > 사이트 설정에서 문구 수정). 첫 줄은 굵게 */
export function MixNotice({ lines, className = "" }: { lines: string[]; className?: string }) {
  return (
    <div className={`flex gap-2 rounded-[8px] bg-tile px-3.5 py-3 text-[12.5px] leading-relaxed text-ink/80 ${className}`}>
      <Info size={15} className="mt-0.5 shrink-0 text-point" />
      <p>
        {lines.map((l, i) => (
          <span key={i} className={i === 0 ? "block font-medium text-ink" : "block"}>{l}</span>
        ))}
      </p>
    </div>
  );
}
