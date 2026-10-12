// 제품 NEW 표시 (서버·클라이언트 공용)

/** 출시일(없으면 등록일)부터 newDays 일 동안 NEW */
export function isNewProduct(p: { released_at: string | null; created_at: string }, newDays: number, now = Date.now()) {
  const start = Date.parse(p.released_at ?? p.created_at);
  if (!Number.isFinite(start) || newDays <= 0) return false;
  return now >= start && now < start + newDays * 86_400_000;
}
