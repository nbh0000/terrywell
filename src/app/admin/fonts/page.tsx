import { FONTS } from "@/components/editor/constants";
import { getContent } from "@/lib/site";
import { Card, PageTitle } from "../ui";
import { FontsForm } from "./FontsForm";

export const metadata = { title: "글꼴" };

// 에디터 글꼴 관리: 기본 글꼴 + 관리자가 파일로 올리는 글꼴
export default async function AdminFonts() {
  const { custom } = await getContent("fonts");
  return (
    <>
      <PageTitle title="에디터 글꼴" />
      <div className="space-y-5">
        <Card title="추가한 글꼴">
          <FontsForm initial={custom} />
        </Card>
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
