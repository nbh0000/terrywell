import type { Metadata } from "next";
import { DocumentsClient } from "./DocumentsClient";

export const metadata: Metadata = { title: "거래내역 출력" };

export default function DocumentsPage() {
  return <DocumentsClient />;
}
