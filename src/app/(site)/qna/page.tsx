import type { Metadata } from "next";
import { QnaClient } from "./QnaClient";

export const metadata: Metadata = { title: "Q&A" };

export default function QnaPage() {
  return <QnaClient />;
}
