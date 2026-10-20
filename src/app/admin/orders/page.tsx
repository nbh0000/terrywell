import { OrdersAdminClient } from "./OrdersAdminClient";

export const metadata = { title: "주문 관리" };

export default function AdminOrders() {
  return <OrdersAdminClient />;
}
