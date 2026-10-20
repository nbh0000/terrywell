// 장바구니 줄과 금액. 계산은 서버(PHP /api/cart)가 하고 화면은 결과만 받는다.

import { apiGet } from "@/lib/api";

export interface CartLine {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  productNameEn: string;
  colorId: string | null;
  colorName: string | null;
  designId: string | null;
  uploadId: string | null;
  thumbnail: string | null; // 디자인 썸네일 또는 제품 사진
  fileName: string | null; // PDF 업로드 파일명
  quantity: number;
  qtyStep: number; // 수량 단위 (5P 세트면 5)
  unitPrice: number;
  lineAmount: number;
  supply: number;
  vat: number;
  total: number;
}

export interface CartSummary {
  lines: CartLine[];
  supply: number;
  vat: number;
  itemsTotal: number;
  shipping: number;
  grandTotal: number;
}

/** 로그인한 회원의 장바구니 (userId 는 서버가 세션에서 안다) */
export async function loadCart(_userId?: string, onlyIds?: string[]): Promise<CartSummary> {
  return apiGet<CartSummary>(`cart${onlyIds?.length ? `?ids=${encodeURIComponent(onlyIds.join(","))}` : ""}`);
}
