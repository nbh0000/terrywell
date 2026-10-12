import type { Metadata } from "next";
import Link from "next/link";
import { CenterShell } from "@/components/support/CenterShell";
import { InquiryList } from "@/components/support/InquiryList";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "1:1 문의" };

export default async function InquiryPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <CenterShell title="1:1 문의">
        <div className="rounded-[10px] border border-line px-6 py-14 text-center">
          <p className="text-[15px]">1:1 문의는 로그인 후 남길 수 있습니다.</p>
          <p className="mt-1 text-[13.5px] text-muted">답변이 오면 마이페이지에서 확인할 수 있습니다.</p>
          <div className="mt-6 flex justify-center gap-2">
            <Link href={`/login?next=${encodeURIComponent("/qna/inquiry/new")}`} className="inline-flex h-11 items-center rounded-[6px] bg-ink px-6 text-[14px] text-white">로그인하고 문의하기</Link>
            <Link href="/qna" className="inline-flex h-11 items-center rounded-[6px] border border-line px-5 text-[14px]">자주 묻는 질문 보기</Link>
          </div>
        </div>
      </CenterShell>
    );
  }
  const items = await getDb().select("inquiries", { where: { user_id: user.id }, order: [{ column: "created_at", ascending: false }] });
  return (
    <CenterShell title="1:1 문의">
      <InquiryList items={items} />
    </CenterShell>
  );
}
