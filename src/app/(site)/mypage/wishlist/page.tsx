import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { won } from "@/lib/pricing";

export const metadata: Metadata = { title: "찜 목록" };

export default async function WishlistPage() {
  const user = await requireUser("/mypage/wishlist");
  const db = getDb();
  const wishes = await db.select("wishlists", { where: { user_id: user.id }, order: [{ column: "created_at", ascending: false }] });
  const products = (await Promise.all(wishes.map((w) => db.get("products", { id: w.product_id })))).filter((p) => p?.is_visible);
  if (!products.length)
    return (
      <p className="py-16 text-center text-[14px] text-muted">
        찜한 제품이 없습니다. <Link href="/products" className="text-ink underline">제품 보러 가기</Link>
      </p>
    );
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3">
      {products.map(
        (p) =>
          p && (
            <li key={p.id}>
              <Link href={`/products/${p.slug}`} className="block">
                <div className="aspect-square bg-paper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.images[0]?.url && <img src={p.images[0].url} alt={p.images[0].alt} className="h-full w-full object-cover" />}
                </div>
                <p className="mt-2 font-display text-[15px] font-medium">{p.name_en}</p>
                <p className="text-[14px]">{p.name_ko}</p>
                <p className="text-[13px] text-muted">{won(p.base_price)}~</p>
              </Link>
            </li>
          ),
      )}
    </ul>
  );
}
