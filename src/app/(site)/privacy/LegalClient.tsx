"use client";

import { Loading, usePageData } from "@/lib/page";
import { getContent } from "@/lib/site";

// 이용약관 · 개인정보처리방침 (관리자 > 사이트 설정에서 수정)
export function LegalClient({ kind, title }: { kind: "terms" | "privacy"; title: string }) {
  const { data: legal } = usePageData(() => getContent("legal"));
  return (
    <article className="mx-auto w-full max-w-[860px] px-5 pb-24 pt-12 md:px-10 md:pt-16">
      <h1 className="text-[22px] font-medium">{title}</h1>
      {!legal ? <Loading /> : <div className="prose-tw mt-8 border-t border-ink/70 pt-6 [&_h3]:mt-6 [&_h3]:font-semibold" dangerouslySetInnerHTML={{ __html: legal[kind] }} />}
    </article>
  );
}
