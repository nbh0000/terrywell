import type { ReactNode } from "react";
import { AdminShell } from "./AdminShell";

export const metadata = { title: { default: "관리자", template: "%s | 관리자" }, robots: { index: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
