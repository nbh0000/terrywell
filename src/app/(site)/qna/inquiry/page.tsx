import type { Metadata } from "next";
import { InquiryIndexClient } from "./InquiryIndexClient";

export const metadata: Metadata = { title: "1:1 문의" };

export default function InquiryPage() {
  return <InquiryIndexClient />;
}
