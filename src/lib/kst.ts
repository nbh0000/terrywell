// 한국 시간 기준 날짜 (서버 시간대와 관계없이)

/** 오늘 한국 날짜 YYYY-MM-DD */
export function kstToday(now: Date = new Date()) {
  return new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}

/** 어떤 시각의 한국 날짜 YYYY-MM-DD */
export function kstDate(d = new Date()) {
  return kstToday(d);
}

/** n 일 전 한국시간 날짜 */
export function kstDaysAgo(n: number) {
  return kstToday(new Date(Date.now() - n * 86400_000));
}
