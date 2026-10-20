import type { Metadata } from "next";
import { CustomLabelClient } from "./CustomLabelClient";

export const metadata: Metadata = { title: "커스텀 라벨" };

export default function CustomLabelPage() {
  return <CustomLabelClient />;
}
