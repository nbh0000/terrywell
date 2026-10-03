import Link from "next/link";
import { BookOpen, Heart, LogIn, Search, ShoppingBag, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";
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
    <header className="sticky top-0 z-40 border-b border-line bg-page/95 backdrop-blur">
      {/* PC */}
      <div className="mx-auto hidden h-[78px] max-w-[1280px] items-center px-8 lg:flex">
        <Logo />
        <NavLinks nav={NAV} />
        <div className="ml-auto flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-5">
            {icons.map(({ href, label, Icon, badge }) => (
              <Link key={href} href={href} aria-label={label} className="relative text-ink transition-colors hover:text-point">
                <Icon size={20} strokeWidth={1.5} />
                {badge ? (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-point px-1 text-[10px] font-medium text-white">
                    {badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3 text-[12px] text-point">
            {user ? (
              <form action={logoutAction}>
                <button type="submit" className="inline-flex items-center gap-1 hover:text-point-dark"><LogIn size={13} strokeWidth={1.6} />로그아웃</button>
              </form>
            ) : (
              <Link href="/login" className="inline-flex items-center gap-1 hover:text-point-dark"><LogIn size={13} strokeWidth={1.6} />로그인/회원가입</Link>
            )}
            <Link href="/guide" className="inline-flex items-center gap-1 hover:text-point-dark"><BookOpen size={13} strokeWidth={1.6} />이용가이드</Link>
            {user?.role === "admin" && (
              <Link href="/admin" className="hover:text-point-dark">관리자</Link>
            )}
          </div>
        </div>
      </div>

      {/* 모바일: 햄버거 · 로고 · 장바구니 */}
      <div className="flex h-14 items-center justify-between px-4 lg:hidden">
        <MobileMenu nav={NAV} loggedIn={!!user} isAdmin={user?.role === "admin"} />
        <Logo />
        <Link href="/cart" aria-label="장바구니" className="relative p-1 text-ink">
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
