import type { Metadata } from "next";
import { PageStub } from "@/components/PageStub";

export const metadata: Metadata = { title: "개인정보처리방침" };

export default async function Page() {
  return <PageStub title="개인정보처리방침" step="8" />;
}
