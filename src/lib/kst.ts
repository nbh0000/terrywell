// 한국 시간 기준 날짜 (서버 시간대와 관계없이)

/** 오늘 한국 날짜 YYYY-MM-DD */
export function kstToday(now: Date = new Date()) {
  return new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}
