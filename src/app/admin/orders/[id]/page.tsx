import { OrderAdminClient } from "./OrderAdminClient";

export const metadata = { title: "주문 상세" };

export function generateStaticParams() {
  return [{ id: "__live" }];
}

export default function AdminOrder() {
  return <OrderAdminClient />;
}
