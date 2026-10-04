import type { Metadata } from "next";
import { getContent } from "@/lib/site";

export const metadata: Metadata = { title: "이용약관" };

export default async function Page() {
  const legal = await getContent("legal");
  return (
    <article className="mx-auto w-full max-w-[860px] px-5 pb-24 pt-12 md:px-10 md:pt-16">
      <h1 className="text-[22px] font-medium">이용약관</h1>
      <div className="prose-tw mt-8 border-t border-ink/70 pt-6 [&_h3]:mt-6 [&_h3]:font-semibold" dangerouslySetInnerHTML={{ __html: legal.terms }} />
    </article>
  );
}
