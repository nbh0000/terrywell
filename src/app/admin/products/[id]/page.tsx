import { ProductEditClient } from "./ProductEditClient";

export const metadata = { title: "제품 수정" };

export function generateStaticParams() {
  return [{ id: "__live" }];
}

export default function EditProduct() {
  return <ProductEditClient />;
}
