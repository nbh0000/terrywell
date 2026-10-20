import type { Metadata } from "next";
import { NoticesClient } from "./NoticesClient";

export const metadata: Metadata = { title: "공지사항" };

export default function NoticesPage() {
  return <NoticesClient />;
}
