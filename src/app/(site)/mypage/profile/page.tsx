import type { Metadata } from "next";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = { title: "회원정보" };

export default function ProfilePage() {
  return <ProfileClient />;
}
