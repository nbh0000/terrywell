import type { Metadata } from "next";
import { PageStub } from "@/components/PageStub";
import { requireUser } from "@/lib/auth";
export const metadata: Metadata = { title: "장바구니" };

export default async function Page() {
  await requireUser("/cart");
  return <PageStub title="장바구니" step="5" />;
}
