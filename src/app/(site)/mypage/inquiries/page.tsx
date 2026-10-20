import type { Metadata } from "next";
import { MyInquiriesClient } from "./MyInquiriesClient";

export const metadata: Metadata = { title: "1:1 문의" };

export default function MyInquiries() {
  return <MyInquiriesClient />;
}
