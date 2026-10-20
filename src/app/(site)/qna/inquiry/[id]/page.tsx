import type { Metadata } from "next";
import { InquiryDetailClient } from "./InquiryDetailClient";

export const metadata: Metadata = { title: "1:1 문의" };

export function generateStaticParams() {
  return [{ id: "__live" }];
}

export default function InquiryDetail() {
  return <InquiryDetailClient />;
}
