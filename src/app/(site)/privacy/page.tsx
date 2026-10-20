import type { Metadata } from "next";
import { LegalClient } from "./LegalClient";

export const metadata: Metadata = { title: "개인정보처리방침" };

export default function Page() {
  return <LegalClient kind="privacy" title="개인정보처리방침" />;
}
