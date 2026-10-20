"use client";

import { getSession, requireUser } from "@/lib/auth";
import { loadCart } from "@/lib/cart";
import { Loading, getQuery, go, usePageData } from "@/lib/page";
import { CheckoutForm } from "./CheckoutForm";

export function CheckoutClient() {
  const { data } = usePageData(async () => {
    const ids = (getQuery().get("items") ?? "").split(",").filter(Boolean);
    const user = await requireUser(`/checkout${ids.length ? `?items=${ids.join(",")}` : ""}`);
    const [cart, session] = await Promise.all([loadCart(user.id, ids.length ? ids : undefined), getSession()]);
    if (!cart.lines.length) go("/cart");
    return { user, cart, payment: session.portone };
  });
  return (
    <section className="mx-auto w-full max-w-[1080px] px-5 pb-24 pt-12 md:px-10 md:pt-16">
      <h1 className="font-display text-[22px] font-medium">Order</h1>
      <p className="text-[14px] text-muted">주문서</p>
      {!data ? (
        <Loading />
      ) : (
        <CheckoutForm
          cart={data.cart}
          user={{ name: data.user.name, phone: data.user.phone, email: data.user.email, companyName: data.user.company_name, businessNumber: data.user.business_number }}
          payment={{ mode: data.payment.mode, storeId: data.payment.storeId, channelKey: data.payment.channelKey }}
        />
      )}
    </section>
  );
}
