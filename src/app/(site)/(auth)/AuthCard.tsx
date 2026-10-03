import type { ReactNode } from "react";

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-[420px] px-5 py-16 md:py-24">
      <h1 className="mb-10 text-center text-2xl font-medium tracking-tight">{title}</h1>
      {children}
    </section>
  );
}
