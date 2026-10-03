import type { Metadata } from "next";
import { PageStub } from "@/components/PageStub";

export const metadata: Metadata = { title: "견적문의" };

export default async function Page() {
  return <PageStub title="견적문의" step="6" />;
}
