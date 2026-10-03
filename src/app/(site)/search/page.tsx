import type { Metadata } from "next";
import { PageStub } from "@/components/PageStub";

export const metadata: Metadata = { title: "검색" };

export default async function Page() {
  return <PageStub title="검색" step="5" />;
}
