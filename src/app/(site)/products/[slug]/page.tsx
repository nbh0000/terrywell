import { notFound } from "next/navigation";
import { PageStub } from "@/components/PageStub";
import { getDb } from "@/lib/db";

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getDb().get("products", { slug, is_visible: true });
  if (!product) notFound();
  return <PageStub title={product.name_ko} step="5" />;
}
