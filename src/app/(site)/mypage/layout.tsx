import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { MyNav } from "./MyNav";

export default async function MyLayout({ children }: LayoutProps<"/mypage">) {
  const user = await requireUser("/mypage");
  return (
    <section className="mx-auto w-full max-w-[1080px] px-5 pb-24 pt-12 md:px-10 md:pt-16">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-display text-[22px] font-medium">My Page</h1>
          <p className="text-[14px] text-muted">{user.name || user.email} 님</p>
        </div>
        <Link href="/cart" className="text-[13px] text-muted underline">장바구니</Link>
      </div>
      <MyNav />
      <div className="mt-8">{children}</div>
    </section>
  );
}
