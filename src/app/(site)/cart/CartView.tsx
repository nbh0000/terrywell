"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileText, Minus, Plus, X } from "lucide-react";
import type { CartLine } from "@/lib/cart";
import { won } from "@/lib/pricing";
import { removeCartItemsAction, updateCartQtyAction } from "./actions";

export function CartView({ lines, shippingFee }: { lines: CartLine[]; shippingFee: number }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(lines.map((l) => l.id));
  const [pending, start] = useTransition();
  const sel = lines.filter((l) => selected.includes(l.id));
  const itemsTotal = sel.reduce((s, l) => s + l.total, 0);
  const ship = sel.length ? shippingFee : 0;

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const setQty = (id: string, q: number) => start(async () => { await updateCartQtyAction(id, q); router.refresh(); });

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="flex items-center justify-between border-b border-ink/70 pb-3 text-[14px]">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="size-4 accent-point" checked={selected.length === lines.length} onChange={(e) => setSelected(e.target.checked ? lines.map((l) => l.id) : [])} />
            전체 선택 ({selected.length}/{lines.length})
          </label>
          <button type="button" disabled={!selected.length || pending} onClick={() => start(async () => { await removeCartItemsAction(selected); router.refresh(); })} className="text-muted underline disabled:opacity-40">
            선택 삭제
          </button>
        </div>
        <ul>
          {lines.map((l) => (
            <li key={l.id} className="flex gap-4 border-b border-line py-5">
              <input type="checkbox" className="mt-1 size-4 shrink-0 accent-point" checked={selected.includes(l.id)} onChange={() => toggle(l.id)} aria-label={`${l.productName} 선택`} />
              <div className="grid w-24 shrink-0 place-items-center self-start bg-paper p-1.5 md:w-28">
                {l.fileName ? (
                  <div className="flex aspect-[65/45] w-full flex-col items-center justify-center text-muted"><FileText size={22} /><span className="mt-1 text-[10px]">PDF</span></div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  l.thumbnail && <img src={l.thumbnail} alt="" className="w-full" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/products/${l.productSlug}`} className="font-medium hover:underline">{l.productName}</Link>
                    <p className="text-[13px] text-muted">
                      {l.colorName && <>색상 {l.colorName} · </>}
                      {l.fileName ? <>PDF 파일 <span className="break-all">{l.fileName}</span></> : "에디터 디자인"}
                    </p>
                    {l.designId && (
                      <Link href={`/editor/${l.productSlug}?design=${l.designId}${l.colorId ? `&color=${l.colorId}` : ""}`} className="mt-1 inline-block text-[12.5px] text-point underline">디자인 수정</Link>
                    )}
                  </div>
                  <button type="button" onClick={() => start(async () => { await removeCartItemsAction([l.id]); router.refresh(); })} className="text-muted" aria-label="삭제"><X size={18} /></button>
                </div>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                  <div className="flex h-10 items-center border border-line bg-white">
                    <button type="button" className="grid h-full w-9 place-items-center text-muted" disabled={l.quantity <= 1 || pending} onClick={() => setQty(l.id, l.quantity - 1)} aria-label="수량 줄이기"><Minus size={15} /></button>
                    <input
                      key={l.quantity}
                      defaultValue={l.quantity}
                      inputMode="numeric"
                      onBlur={(e) => {
                        const q = Number(e.target.value.replace(/\D/g, ""));
                        if (q >= 1 && q !== l.quantity) setQty(l.id, q);
                      }}
                      className="h-full w-14 text-center text-[14px] outline-none"
                      aria-label="수량"
                    />
                    <button type="button" className="grid h-full w-9 place-items-center" disabled={pending} onClick={() => setQty(l.id, l.quantity + 1)} aria-label="수량 늘리기"><Plus size={15} /></button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{won(l.total)}</p>
                    <p className="text-[12px] text-muted">개별 단가 {won(l.unitPrice)}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="h-fit border border-line bg-paper p-6 lg:sticky lg:top-28">
        <dl className="space-y-2 text-[14px]">
          <div className="flex justify-between"><dt>상품 금액</dt><dd>{won(itemsTotal)}</dd></div>
          <div className="flex justify-between"><dt>배송비</dt><dd>{won(ship)}</dd></div>
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-semibold">결제 예정 금액</span>
          <span className="text-[22px] font-semibold text-point">{won(itemsTotal + ship)}</span>
        </div>
        <button
          type="button"
          disabled={!sel.length}
          onClick={() => router.push(`/checkout?items=${selected.join(",")}`)}
          className="mt-5 h-13 w-full rounded-[10px] bg-point py-3.5 text-[16px] font-medium text-white hover:bg-point-dark disabled:opacity-40"
        >
          {sel.length ? `${sel.length}개 상품 주문하기` : "상품을 선택해 주세요"}
        </button>
      </aside>
    </div>
  );
}
