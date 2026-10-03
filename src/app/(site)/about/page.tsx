import type { Metadata } from "next";
import { PageStub } from "@/components/PageStub";

export const metadata: Metadata = { title: "회사 소개" };

export default async function Page() {
  return <PageStub title="회사 소개" step="6" />;
}
