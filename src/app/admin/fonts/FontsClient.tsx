"use client";

import { FONTS } from "@/components/editor/constants";
import { Loading, usePageData } from "@/lib/page";
import { getContent } from "@/lib/site";
import { Card, PageTitle } from "../ui";
import { FontsForm } from "./FontsForm";

// 에디터 글꼴 관리: 기본 글꼴 + 관리자가 파일로 올리는 글꼴
export function FontsClient() {
  const { data } = usePageData(() => getContent("fonts"));
  return (
    <>
      <PageTitle title="에디터 글꼴" />
      <div className="space-y-5">
        <Card title="추가한 글꼴">{!data ? <Loading className="min-h-20" /> : <FontsForm initial={data.custom} />}</Card>
        <Card title="기본 글꼴 (항상 보임)">
          <ul className="flex flex-wrap gap-2 text-[14px]">
            {FONTS.map((f) => (
              <li key={f.family} className="rounded-[6px] border border-line px-3 py-1.5">{f.label}</li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
