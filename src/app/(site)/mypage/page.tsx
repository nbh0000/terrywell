import type { Metadata } from "next";
import { OrdersClient } from "./OrdersClient";

export const metadata: Metadata = { title: "주문 내역" };

export default function OrdersPage() {
  return <OrdersClient />;
}
