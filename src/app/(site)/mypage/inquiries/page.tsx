import type { Metadata } from "next";
import { InquiryList } from "@/components/support/InquiryList";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "1:1 문의" };

export default async function MyInquiries() {
  const user = await requireUser("/mypage/inquiries");
  const items = await getDb().select("inquiries", { where: { user_id: user.id }, order: [{ column: "created_at", ascending: false }] });
  return <InquiryList items={items} />;
}
