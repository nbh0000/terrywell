import type { ReactNode } from "react";
import { getSetting } from "@/lib/site";
import { SupportNav } from "./SupportNav";

// Q&A(고객센터) 공통 틀: 왼쪽 메뉴 + 운영 안내, 오른쪽 내용 (2026-10 고객 예시 화면 구성)
export async function CenterShell({ title, children }: { title: string; children: ReactNode }) {
  const c = await getSetting("company");
  return (
    <section className="mx-auto grid w-full max-w-[1200px] gap-8 px-5 pb-24 pt-10 md:grid-cols-[220px_1fr] md:gap-14 md:px-10 md:pt-16">
      <aside>
        <h2 className="border-b border-line pb-4 font-display text-[19px] font-medium">Q&amp;A</h2>
        <SupportNav />
        <div className="mt-6 hidden rounded-[8px] bg-tile p-4 text-[12.5px] leading-[1.75] text-ink/75 md:block">
          <p className="mb-1 text-[13px] font-semibold text-ink">고객센터 운영 안내</p>
          <p>{c.phone}</p>
          <p>{c.hours_weekday}</p>
          <p>{c.hours_lunch}</p>
          <p>주말 및 공휴일 휴무</p>
        </div>
      </aside>
      <div className="min-w-0">
        <h1 className="mb-6 text-[22px] font-semibold md:text-[24px]">{title}</h1>
        {children}
      </div>
    </section>
  );
}
