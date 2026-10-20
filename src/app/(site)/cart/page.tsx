import type { Metadata } from "next";
import { CartClient } from "./CartClient";

export const metadata: Metadata = { title: "장바구니" };

export default function CartPage() {
  return <CartClient />;
}
