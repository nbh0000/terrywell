import type { Metadata } from "next";
import { PageStub } from "@/components/PageStub";

export const metadata: Metadata = { title: "이용가이드" };

export default async function Page() {
  return <PageStub title="이용가이드" step="6" />;
}
