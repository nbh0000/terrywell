import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { loadCart } from "@/lib/cart";
import { paymentMode, portone } from "@/lib/payment";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "주문서", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const sp = await searchParams;
  const ids = typeof sp.items === "string" ? sp.items.split(",").filter(Boolean) : [];
  const user = await requireUser(`/checkout${ids.length ? `?items=${ids.join(",")}` : ""}`);
  const cart = await loadCart(user.id, ids.length ? ids : undefined);
  if (!cart.lines.length) redirect("/cart");
  return (
    <section className="mx-auto w-full max-w-[1080px] px-5 pb-24 pt-12 md:px-10 md:pt-16">
      <h1 className="font-display text-[22px] font-medium">Order</h1>
      <p className="text-[14px] text-muted">주문서</p>
      <CheckoutForm
        cart={cart}
        user={{ name: user.name, phone: user.phone, email: user.email, companyName: user.company_name, businessNumber: user.business_number }}
        payment={{ mode: paymentMode, storeId: portone.storeId, channelKey: portone.channelKey }}
      />
    </section>
  );
}
