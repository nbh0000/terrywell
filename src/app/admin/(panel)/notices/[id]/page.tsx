import { NoticeEditClient } from "./NoticeEditClient";

export const metadata = { title: "공지사항 작성" };

export function generateStaticParams() {
  return [{ id: "__live" }];
}

export default function EditNotice() {
  return <NoticeEditClient />;
}
