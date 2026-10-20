import type { Metadata } from "next";
import { ProductsClient } from "./ProductsClient";

export const metadata: Metadata = { title: "제품 소개" };

export default function ProductsPage() {
  return <ProductsClient />;
}
