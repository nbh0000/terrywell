import type { Metadata } from "next";
import { ProductClient } from "./ProductClient";

export const metadata: Metadata = { title: "제품" };

// 정적 내보내기: 실제 slug 는 주소에서 읽는다 (php/_page.php 가 __live 페이지로 보낸다)
export function generateStaticParams() {
  return [{ slug: "__live" }];
}

export default function ProductPage() {
  return <ProductClient />;
}
