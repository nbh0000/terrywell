import { InquiryAdminClient } from "./InquiryAdminClient";

export const metadata = { title: "1:1 문의 답변" };

export function generateStaticParams() {
  return [{ id: "__live" }];
}

export default function AdminInquiry() {
  return <InquiryAdminClient />;
}
