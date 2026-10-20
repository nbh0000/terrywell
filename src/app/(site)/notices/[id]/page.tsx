import type { Metadata } from "next";
import { NoticeClient } from "./NoticeClient";

export const metadata: Metadata = { title: "공지사항" };

// 정적 내보내기: 실제 id 는 주소에서 읽는다 (php/_page.php 가 __live 페이지로 보낸다)
export function generateStaticParams() {
  return [{ id: "__live" }];
}

export default function NoticePage() {
  return <NoticeClient />;
}
