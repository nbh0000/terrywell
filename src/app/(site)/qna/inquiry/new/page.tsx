import type { Metadata } from "next";
import { NewInquiryClient } from "./NewInquiryClient";

export const metadata: Metadata = { title: "1:1 문의하기" };

export default function NewInquiryPage() {
  return <NewInquiryClient />;
}
