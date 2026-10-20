import type { Metadata } from "next";
import { ResetClient } from "./ResetClient";

export const metadata: Metadata = { title: "비밀번호 재설정" };

export default function ResetPage() {
  return <ResetClient />;
}
