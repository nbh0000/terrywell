import Link from "next/link";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { logoutAction } from "@/app/(site)/(auth)/actions";

export const NAV = [
  { href: "/about", label: "회사 소개" },
  { href: "/products", label: "제품 소개" },
  { href: "/quote", label: "견적문의" },
  { href: "/notices", label: "공지사항" },
];

export async function Header() {
  const user = await getCurrentUser();
  const cartCount = user ? await getDb().count("cart_items", { user_id: user.id }) : 0;

  const icons = [
    { href: "/search", label: "검색", Icon: Search },
    { href: "/mypage/wishlist", label: "찜", Icon: Heart },
    { href: "/cart", label: "장바구니", Icon: ShoppingBag, badge: cartCount },
    { href: user ? "/mypage" : "/login", label: user ? "마이페이지" : "로그인", Icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      {/* PC */}
      <div className="mx-auto hidden h-[76px] max-w-[1280px] items-center px-8 lg:flex">
        <Logo />
        <nav className="ml-14 flex gap-10 text-[15px]">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-ink/80 transition-colors hover:text-point">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-5">
            {icons.map(({ href, label, Icon, badge }) => (
              <Link key={href} href={href} aria-label={label} className="relative text-ink/80 transition-colors hover:text-point">
                <Icon size={20} strokeWidth={1.5} />
                {badge ? (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-point px-1 text-[10px] font-medium text-white">
                    {badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted">
            {user ? (
              <form action={logoutAction}>
                <button type="submit" className="hover:text-ink">로그아웃</button>
              </form>
            ) : (
              <Link href="/login" className="hover:text-ink">로그인/회원가입</Link>
            )}
            <span className="text-line">|</span>
            <Link href="/guide" className="hover:text-ink">이용가이드</Link>
            {user?.role === "admin" && (
              <>
                <span className="text-line">|</span>
                <Link href="/admin" className="hover:text-ink">관리자</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 모바일: 햄버거 · 로고 · 장바구니 */}
      <div className="flex h-14 items-center justify-between px-4 lg:hidden">
        <MobileMenu nav={NAV} loggedIn={!!user} isAdmin={user?.role === "admin"} />
        <Logo />
        <Link href="/cart" aria-label="장바구니" className="relative p-1 text-ink/80">
          <ShoppingBag size={22} strokeWidth={1.5} />
          {cartCount ? (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-point px-1 text-[10px] font-medium text-white">
              {cartCount}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}
