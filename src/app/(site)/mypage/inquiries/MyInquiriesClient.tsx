"use client";

import { InquiryList } from "@/components/support/InquiryList";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Loading, usePageData } from "@/lib/page";

export function MyInquiriesClient() {
  const { data } = usePageData(async () => {
    const user = await requireUser("/mypage/inquiries");
    return getDb().select("inquiries", { where: { user_id: user.id }, order: [{ column: "created_at", ascending: false }] });
  });
  if (!data) return <Loading />;
  return <InquiryList items={data} />;
}
