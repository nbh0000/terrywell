import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "회원정보" };

export default async function ProfilePage() {
  const user = await requireUser("/mypage/profile");
  return <ProfileForm user={user} />;
}
