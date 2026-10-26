import { QuoteAdminClient } from "./QuoteAdminClient";

export const metadata = { title: "견적문의 상세" };

export function generateStaticParams() {
  return [{ id: "__live" }];
}

export default function AdminQuote() {
  return <QuoteAdminClient />;
}
