import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { QuoteForm } from "./QuoteForm";

export const metadata: Metadata = { title: "견적문의" };

export default async function QuotePage({ searchParams }: PageProps<"/quote">) {
  const sp = await searchParams;
  const [user, products] = await Promise.all([getCurrentUser(), getDb().select("products", { where: { is_visible: true }, order: [{ column: "sort_order" }] })]);
  return (
    <section className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-12 md:pt-16">
      <h1 className="font-display text-[22px] font-medium">Quote</h1>
      <p className="text-[14px] text-muted">견적문의</p>
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
    </section>
  );
}
