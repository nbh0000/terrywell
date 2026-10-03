import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "관리자" };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex h-14 items-center gap-6 border-b border-line px-6">
        <Link href="/admin" className="font-serif font-bold tracking-[0.06em] text-point">TERRYWELL</Link>
        <span className="text-sm text-muted">관리자</span>
        <Link href="/" className="ml-auto text-sm text-muted hover:text-ink">사이트로</Link>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
