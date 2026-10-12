import type { Metadata } from "next";
import { CenterShell } from "@/components/support/CenterShell";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { QuoteForm } from "./QuoteForm";

export const metadata: Metadata = { title: "견적 문의" };

export default async function QuotePage({ searchParams }: PageProps<"/quote">) {
  const sp = await searchParams;
  const [user, products] = await Promise.all([getCurrentUser(), getDb().select("products", { where: { is_visible: true }, order: [{ column: "sort_order" }] })]);
  return (
    <CenterShell title="견적 문의">
      <p className="-mt-3 text-[14px] text-muted">대량 주문이나 맞춤 제작은 수량과 희망 납기를 남겨 주시면 견적을 보내드립니다.</p>
      <QuoteForm
        products={products.map((p) => p.name_ko)}
        defaults={{
          company: user?.company_name ?? "",
          name: user?.name ?? "",
          phone: user?.phone ?? "",
          email: user?.email ?? "",
          product: typeof sp.product === "string" ? sp.product : "",
        }}
      />
    </CenterShell>
  );
}
