// 새 제품 표시. 사진 왼쪽 위에 얹는다
export function NewBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[4px] bg-white/95 px-2 py-[3px] font-display text-[10.5px] font-medium leading-none tracking-[0.14em] text-point shadow-[0_1px_3px_rgba(36,26,24,0.08)] ${className}`}
    >
      <span aria-hidden className="size-[5px] rounded-full bg-point/70" />
      NEW
    </span>
  );
}
