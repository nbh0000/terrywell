"use client";

import { CenterShell } from "@/components/support/CenterShell";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Loading, getQuery, usePageData } from "@/lib/page";
import { QuoteForm } from "./QuoteForm";

export function QuoteClient() {
  const { data } = usePageData(async () => {
    const [user, products] = await Promise.all([getCurrentUser(), getDb().select("products", { where: { is_visible: true }, order: [{ column: "sort_order" }] })]);
    return { user, products, product: getQuery().get("product") ?? "" };
  });
  return (
    <CenterShell title="견적 문의">
      <p className="-mt-3 text-[14px] text-muted">대량 주문이나 맞춤 제작은 수량과 희망 납기를 남겨 주시면 견적을 보내드립니다.</p>
      {!data ? (
        <Loading />
      ) : (
        <QuoteForm
          products={data.products.map((p) => p.name_ko)}
          defaults={{
            company: data.user?.company_name ?? "",
            name: data.user?.name ?? "",
            phone: data.user?.phone ?? "",
            email: data.user?.email ?? "",
            product: data.product,
          }}
        />
      )}
    </CenterShell>
  );
}
