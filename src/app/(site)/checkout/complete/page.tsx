import type { Metadata } from "next";
import { CompleteClient } from "./CompleteClient";

export const metadata: Metadata = { title: "결제 완료", robots: { index: false } };

export default function CompletePage() {
  return <CompleteClient />;
}
