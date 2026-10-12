// 1:1 문의 공용 값 (서버·클라이언트)

/** 문의 유형. faq = 고르면 먼저 보여 줄 자주 묻는 질문 분류 */
export const INQUIRY_TYPES: { label: string; faq: string | null }[] = [
  { label: "상품/옵션", faq: "주문/결제" },
  { label: "주문/결제", faq: "주문/결제" },
  { label: "디자인 확인", faq: "디자인" },
  { label: "배송/출고", faq: "배송" },
  { label: "주문 변경/취소", faq: "반품/교환/취소" },
  { label: "증빙서류 (견적서·세금계산서)", faq: "주문/결제" },
  { label: "상품·배송 문제", faq: "반품/교환/취소" },
  { label: "기타", faq: null },
];

export const INQUIRY_STATUS_LABEL = { waiting: "답변 대기", answered: "답변 완료" } as const;
