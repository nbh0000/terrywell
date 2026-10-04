"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText } from "lucide-react";
import { won } from "@/lib/pricing";
import type { loadCart } from "@/lib/cart";
import { completePaymentAction, createOrderAction, type CheckoutInput } from "./actions";

type Cart = Awaited<ReturnType<typeof loadCart>>;

declare global {
  interface Window {
    daum?: { Postcode: new (o: { oncomplete: (d: { zonecode: string; roadAddress: string; jibunAddress: string; buildingName: string }) => void }) => { open: () => void } };
  }
}

const input = "h-11 w-full rounded-[4px] border border-line bg-white px-3 text-[14.5px] outline-none focus:border-ink/50";

export function CheckoutForm({
  cart,
  user,
  payment,
}: {
  cart: Cart;
  user: { name: string; phone: string; email: string; companyName: string; businessNumber: string };
  payment: { mode: "portone" | "mock"; storeId: string; channelKey: string };
}) {
  const router = useRouter();
  const [r, setR] = useState({ name: user.name, phone: user.phone, zip: "", address1: "", address2: "", memo: "" });
  const [tax, setTax] = useState({ requested: false, company_name: user.companyName, business_number: user.businessNumber, ceo: "", email: user.email, business_type: "", business_item: "" });
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mockOrder, setMockOrder] = useState<{ orderId: string; amount: number } | null>(null);

  async function searchAddress() {
    if (!window.daum?.Postcode) {
      await new Promise<void>((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
        s.onload = () => res();
        s.onerror = () => rej();
        document.body.appendChild(s);
      }).catch(() => setErr("주소 검색을 불러오지 못했습니다. 직접 입력해 주세요."));
    }
    if (!window.daum?.Postcode) return;
    new window.daum.Postcode({
      oncomplete: (d) => setR((v) => ({ ...v, zip: d.zonecode, address1: d.roadAddress || d.jibunAddress, address2: d.buildingName ? `(${d.buildingName}) ` : "" })),
    }).open();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) return setErr("주문 내용 확인 및 결제 진행에 동의해 주세요.");
    setErr(null);
    setBusy(true);
    try {
      const res = await createOrderAction({ itemIds: cart.lines.map((l) => l.id), recipient: r, taxInvoice: tax } satisfies CheckoutInput);
      if (!res.ok) return setErr(res.error);
      if (res.mode === "mock") {
        setMockOrder({ orderId: res.orderId, amount: res.amount });
        return;
      }
      const PortOne = await import("@portone/browser-sdk/v2");
      const pay = await PortOne.requestPayment({
        storeId: payment.storeId,
        channelKey: payment.channelKey,
        paymentId: res.orderNo,
        orderName: res.orderName,
        totalAmount: res.amount,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        customer: { fullName: r.name, phoneNumber: r.phone.replace(/\D/g, ""), email: user.email },
        redirectUrl: `${location.origin}/checkout/complete?order=${res.orderId}`,
      });
      if (!pay || pay.code) return setErr(pay?.message ?? "결제를 취소했습니다.");
      const done = await completePaymentAction(res.orderId, pay.paymentId);
      if (!done.ok) return setErr(done.error ?? "결제를 확인하지 못했습니다.");
      router.push(`/checkout/complete?order=${res.orderId}`);
    } finally {
      setBusy(false);
    }
  }

  async function mockPay() {
    if (!mockOrder) return;
    setBusy(true);
    const done = await completePaymentAction(mockOrder.orderId, null);
    setBusy(false);
    if (!done.ok) return setErr(done.error ?? "결제를 확인하지 못했습니다.");
    router.push(`/checkout/complete?order=${mockOrder.orderId}`);
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
      <div className="space-y-10">
        <section>
          <h2 className="border-b border-ink/70 pb-3 text-[16px] font-semibold">주문 상품</h2>
          <ul>
            {cart.lines.map((l) => (
              <li key={l.id} className="flex gap-4 border-b border-line py-4">
                <div className="grid w-20 shrink-0 place-items-center bg-paper p-1">
                  {l.fileName ? <FileText size={20} className="text-muted" /> : l.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.thumbnail} alt="" className="w-full" />
                  )}
                </div>
                <div className="flex-1 text-[14px]">
                  <p className="font-medium">{l.productName}</p>
                  <p className="text-[13px] text-muted">{l.colorName && `색상 ${l.colorName} · `}{l.fileName ? `PDF ${l.fileName}` : "에디터 디자인"} · {l.quantity.toLocaleString()}개</p>
                </div>
                <p className="text-[14px] font-medium">{won(l.total)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="border-b border-ink/70 pb-3 text-[16px] font-semibold">배송 정보</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-[13px]">받는 분 *<input className={`${input} mt-1`} value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} required autoComplete="name" /></label>
            <label className="text-[13px]">연락처 *<input className={`${input} mt-1`} value={r.phone} onChange={(e) => setR({ ...r, phone: e.target.value })} required inputMode="tel" placeholder="010-0000-0000" autoComplete="tel" /></label>
          </div>
          <div className="mt-3 flex gap-2">
            <input className={`${input} w-32`} value={r.zip} onChange={(e) => setR({ ...r, zip: e.target.value })} placeholder="우편번호" aria-label="우편번호" />
            <button type="button" onClick={searchAddress} className="h-11 shrink-0 rounded-[4px] border border-ink px-4 text-[14px]">주소 검색</button>
          </div>
          <input className={`${input} mt-2`} value={r.address1} onChange={(e) => setR({ ...r, address1: e.target.value })} placeholder="주소 *" aria-label="주소" required />
          <input className={`${input} mt-2`} value={r.address2} onChange={(e) => setR({ ...r, address2: e.target.value })} placeholder="상세 주소" aria-label="상세 주소" />
          <input className={`${input} mt-2`} value={r.memo} onChange={(e) => setR({ ...r, memo: e.target.value })} placeholder="배송 메모 (선택)" aria-label="배송 메모" />
        </section>

        <section>
          <h2 className="border-b border-ink/70 pb-3 text-[16px] font-semibold">세금계산서</h2>
          <label className="mt-4 flex items-center gap-2 text-[14px]">
            <input type="checkbox" className="size-4 accent-point" checked={tax.requested} onChange={(e) => setTax({ ...tax, requested: e.target.checked })} />
            세금계산서 발행 요청
          </label>
          {tax.requested && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-[13px]">상호 *<input className={`${input} mt-1`} value={tax.company_name} onChange={(e) => setTax({ ...tax, company_name: e.target.value })} /></label>
              <label className="text-[13px]">사업자등록번호 *<input className={`${input} mt-1`} value={tax.business_number} onChange={(e) => setTax({ ...tax, business_number: e.target.value })} placeholder="000-00-00000" /></label>
              <label className="text-[13px]">대표자<input className={`${input} mt-1`} value={tax.ceo} onChange={(e) => setTax({ ...tax, ceo: e.target.value })} /></label>
              <label className="text-[13px]">계산서 받을 이메일 *<input className={`${input} mt-1`} type="email" value={tax.email} onChange={(e) => setTax({ ...tax, email: e.target.value })} /></label>
              <label className="text-[13px]">업태<input className={`${input} mt-1`} value={tax.business_type} onChange={(e) => setTax({ ...tax, business_type: e.target.value })} /></label>
              <label className="text-[13px]">종목<input className={`${input} mt-1`} value={tax.business_item} onChange={(e) => setTax({ ...tax, business_item: e.target.value })} /></label>
            </div>
          )}
        </section>
      </div>

      <aside className="h-fit border border-line bg-paper p-6 lg:sticky lg:top-28">
        <dl className="space-y-2 text-[14px]">
          <div className="flex justify-between"><dt>공급가액</dt><dd>{won(cart.supply)}</dd></div>
          <div className="flex justify-between"><dt>부가가치세</dt><dd>{won(cart.vat)}</dd></div>
          <div className="flex justify-between"><dt>배송비</dt><dd>{won(cart.shipping)}</dd></div>
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-semibold">총 결제금액</span>
          <span className="text-[22px] font-semibold text-point">{won(cart.grandTotal)}</span>
        </div>
        <label className="mt-5 flex items-start gap-2 text-[13px] leading-relaxed">
          <input type="checkbox" className="mt-0.5 size-4 accent-point" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          주문 상품과 결제 금액을 확인했으며 결제 진행에 동의합니다.
        </label>
        {err && <p role="alert" className="mt-3 text-[13px] text-alert">{err}</p>}
        <button type="submit" disabled={busy} className="mt-4 w-full rounded-[10px] bg-point py-3.5 text-[16px] font-medium text-white hover:bg-point-dark disabled:opacity-50">
          {busy ? "처리 중…" : `${won(cart.grandTotal)} 결제하기`}
        </button>
        {payment.mode === "mock" && <p className="mt-3 text-[12px] text-muted">포트원 키를 설정하기 전이라 테스트 결제로 진행됩니다. 실제 결제는 일어나지 않습니다.</p>}
      </aside>

      {mockOrder && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5">
          <div role="dialog" aria-modal="true" aria-label="테스트 결제" className="w-full max-w-[360px] rounded-[12px] bg-white p-6">
            <h2 className="text-[17px] font-semibold">테스트 결제</h2>
            <p className="mt-2 text-[14px] text-muted">카드 결제 대신 테스트로 결제를 완료합니다.</p>
            <p className="mt-4 text-[24px] font-semibold text-point">{won(mockOrder.amount)}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" className="h-11 rounded-[8px] border border-line" onClick={() => setMockOrder(null)}>취소</button>
              <button type="button" className="h-11 rounded-[8px] bg-point text-white" disabled={busy} onClick={mockPay}>결제 완료</button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
