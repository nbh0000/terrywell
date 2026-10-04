// 가격 계산 (서버·클라이언트 공용). 결제 금액은 반드시 서버에서 다시 계산한다.

export interface Tier {
  min_qty: number;
  unit_price: number;
}

/** 수량 구간별 단가. 구간이 없으면 기본 단가 */
export function unitPriceFor(qty: number, tiers: Tier[], basePrice: number) {
  const t = [...tiers].sort((a, b) => b.min_qty - a.min_qty).find((x) => qty >= x.min_qty);
  return t?.unit_price ?? basePrice;
}

/** 줄 금액을 공급가/부가세/합계로 나눈다 */
export function splitVat(amount: number, vatIncluded: boolean) {
  if (vatIncluded) {
    const supply = Math.round(amount / 1.1);
    return { supply, vat: amount - supply, total: amount };
  }
  const vat = Math.round(amount * 0.1);
  return { supply: amount, vat, total: amount + vat };
}

export function shippingFee(itemsTotal: number, s: { fee: number; free_over: number }) {
  if (itemsTotal <= 0) return 0;
  return s.free_over > 0 && itemsTotal >= s.free_over ? 0 : s.fee;
}

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
