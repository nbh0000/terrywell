import type { Metadata } from "next";
import { DesignsClient } from "./DesignsClient";

export const metadata: Metadata = { title: "저장한 디자인" };

export default function DesignsPage() {
  return <DesignsClient />;
}
