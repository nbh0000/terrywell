import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { loadCart } from "@/lib/cart";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "장바구니" };

export default async function CartPage() {
  const user = await requireUser("/cart");
  const cart = await loadCart(user.id);
  return (
    <section className="mx-auto w-full max-w-[1080px] px-5 pb-24 pt-12 md:px-10 md:pt-16">
      <h1 className="font-display text-[22px] font-medium">Cart</h1>
      <p className="text-[14px] text-muted">장바구니</p>
      {cart.lines.length === 0 ? (
        <div className="mt-10 border-y border-line py-20 text-center">
          <p className="text-[15px] text-muted">장바구니에 담긴 상품이 없습니다.</p>
          <Link href="/products" className="mt-6 inline-flex h-12 items-center bg-ink px-8 text-[15px] text-white">제품 보러 가기</Link>
        </div>
      ) : (
        <CartView lines={cart.lines} shippingFee={cart.shipping} />
      )}
    </section>
  );
}
