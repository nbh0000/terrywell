import type { Metadata } from "next";
import { PageStub } from "@/components/PageStub";

export const metadata: Metadata = { title: "커스텀 라벨" };

export default async function Page() {
  return <PageStub title="커스텀 라벨" step="6" />;
}
