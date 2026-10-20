"use client";

import { requireUser } from "@/lib/auth";
import { Loading, usePageData } from "@/lib/page";
import { ProfileForm } from "./ProfileForm";

export function ProfileClient() {
  const { data: user } = usePageData(() => requireUser("/mypage/profile"));
  if (!user) return <Loading />;
  return <ProfileForm user={user} />;
}
