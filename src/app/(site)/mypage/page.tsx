import type { Metadata } from "next";
import { PageStub } from "@/components/PageStub";
import { requireUser } from "@/lib/auth";
export const metadata: Metadata = { title: "마이페이지" };

export default async function Page() {
  await requireUser("/mypage");
  return <PageStub title="마이페이지" step="5" />;
}
