import type { Metadata } from "next";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = { title: "주문서", robots: { index: false } };

export default function CheckoutPage() {
  return <CheckoutClient />;
}
