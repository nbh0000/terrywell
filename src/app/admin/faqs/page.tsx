import Link from "next/link";
import { getDb } from "@/lib/db";
import { btnCls, Empty, PageTitle, Table } from "../ui";
import { deleteFaqAction } from "../support/actions";

export const metadata = { title: "자주 묻는 질문" };

export default async function AdminFaqs() {
  const faqs = await getDb({ admin: true }).select("faqs", { order: [{ column: "sort_order" }] });
  return (
    <>
      <PageTitle title="자주 묻는 질문">
        <Link href="/admin/faqs/new" className={btnCls}>질문 추가</Link>
      </PageTitle>
      <p className="-mt-3 mb-4 text-[13px] text-muted">Q&amp;A 화면과 1:1 문의 유형별 추천 질문에 나옵니다. 분류 이름이 같으면 같은 탭에 모입니다.</p>
      {faqs.length === 0 ? (
        <Empty>등록된 질문이 없습니다.</Empty>
      ) : (
        <Table head={["순서", "분류", "질문", "노출", ""]}>
          {faqs.map((f) => (
            <tr key={f.id}>
              <td className="px-4 py-2.5 text-muted">{f.sort_order}</td>
              <td className="whitespace-nowrap px-4 py-2.5">{f.category}</td>
              <td className="px-4 py-2.5"><Link href={`/admin/faqs/${f.id}`} className="underline">{f.question}</Link></td>
              <td className="px-4 py-2.5">{f.is_visible ? "노출" : "숨김"}</td>
              <td className="px-4 py-2.5 text-right">
                <form action={deleteFaqAction.bind(null, f.id)}><button className="text-[12.5px] text-muted underline">삭제</button></form>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
