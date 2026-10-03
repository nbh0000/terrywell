import type { Metadata } from "next";
import { PageStub } from "@/components/PageStub";

export const metadata: Metadata = { title: "제품 소개" };

export default async function Page() {
  return <PageStub title="제품 소개" step="5" />;
}
