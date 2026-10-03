import type { Metadata } from "next";
import { PageStub } from "@/components/PageStub";

export const metadata: Metadata = { title: "공지사항" };

export default async function Page() {
  return <PageStub title="공지사항" step="6" />;
}
