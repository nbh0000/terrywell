import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";

export async function generateMetadata({ params }: PageProps<"/notices/[id]">): Promise<Metadata> {
  const n = await getDb().get("notices", { id: (await params).id });
  return { title: n?.title ?? "공지사항" };
}

export default async function NoticePage({ params }: PageProps<"/notices/[id]">) {
  const { id } = await params;
  const n = await getDb().get("notices", { id });
  if (!n) notFound();
  return (
    <article className="mx-auto w-full max-w-[960px] px-5 pb-24 pt-12 md:px-10 md:pt-16">
      <p className="font-display text-[14px] text-muted">Notice</p>
      <header className="mt-2 border-b border-ink/70 pb-5">
        <h1 className="text-[22px] font-medium leading-snug">{n.title}</h1>
        <p className="mt-2 text-[13px] text-muted">{new Date(n.created_at).toLocaleDateString("ko-KR")}</p>
      </header>
      <div className="prose-tw min-h-[200px] border-b border-line py-8" dangerouslySetInnerHTML={{ __html: n.body_html }} />
      <div className="mt-8 text-center">
        <Link href="/notices" className="inline-flex h-11 items-center border border-ink px-8 text-[14px]">목록</Link>
      </div>
    </article>
  );
}
