import type { Metadata } from "next";
import { QuoteClient } from "./QuoteClient";

export const metadata: Metadata = { title: "견적 문의" };

export default function QuotePage() {
  return <QuoteClient />;
}
