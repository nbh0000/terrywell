import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";

// 제품 상세는 5단계에서 시안(reference/02)대로 만든다. 지금은 에디터로 들어가는 길만 둔다.
export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getDb().get("products", { slug, is_visible: true });
  if (!product) notFound();
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-20 md:px-8">
      <h1 className="font-display text-2xl font-medium">{product.name_en}</h1>
      <p className="mt-1 text-lg">{product.name_ko}</p>
      <p className="mt-3 text-sm text-muted">제품 상세 화면은 작업 순서 5단계에서 만듭니다.</p>
      {product.allow_editor && (
        <Link href={`/editor/${product.slug}`} className="mt-8 inline-flex h-12 items-center bg-point px-8 text-white hover:bg-point-dark">
          디자인하기
        </Link>
      )}
    </section>
  );
}
