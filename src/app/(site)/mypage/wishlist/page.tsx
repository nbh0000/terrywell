import type { Metadata } from "next";
import { PageStub } from "@/components/PageStub";
import { requireUser } from "@/lib/auth";
export const metadata: Metadata = { title: "찜 목록" };

export default async function Page() {
  await requireUser("/mypage/wishlist");
  return <PageStub title="찜 목록" step="5" />;
}
