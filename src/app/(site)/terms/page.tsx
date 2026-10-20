import type { Metadata } from "next";
import { LegalClient } from "../privacy/LegalClient";

export const metadata: Metadata = { title: "이용약관" };

export default function Page() {
  return <LegalClient kind="terms" title="이용약관" />;
}
