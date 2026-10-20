import type { Metadata } from "next";
import { PrintClient } from "./PrintClient";

export const metadata: Metadata = { title: "거래 서류", robots: { index: false } };

export function generateStaticParams() {
  return [{ id: "__live" }];
}

export default function PrintOrder() {
  return <PrintClient />;
}
