// 사이트 이미지 한 곳 관리.
// 고객 이미지(assets/)를 받으면 public/images/ 아래로 옮기고 여기 경로만 바꾸면 된다.
// null 이면 같은 비율의 placeholder 가 표시된다.

export const IMAGES = {
  logo: null as string | null,            // 헤더 워드마크 (SVG/PNG)
  logoSymbol: null as string | null,      // 푸터 심볼
  homeHero: null as string | null,        // 커튼/수건, 가로형 와이드
  cardCollection: null as string | null,  // 세로형 3:4
  cardCustom: null as string | null,
  cardQuality: null as string | null,
  cardJournal: null as string | null,
  homeBanner: null as string | null,      // 와이드 배너
};
