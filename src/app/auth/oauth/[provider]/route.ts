import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/config";
import { isOAuthProvider } from "@/lib/oauth";
import { OAUTH_STATE_COOKIE } from "@/lib/oauth-cookie";
import { authorizeUrl, fakeMode, isConfigured } from "@/lib/oauth-server";

const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/");

// 간편 로그인 시작: state 를 쿠키에 적어 두고 제공자 로그인 화면으로 보낸다. 키가 없으면 로그인 화면으로 돌아가 안내한다
export async function GET(req: Request, ctx: RouteContext<"/auth/oauth/[provider]">) {
  const { provider } = await ctx.params;
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"));
  const back = (reason: string) =>
    NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}&sns=${reason}&provider=${encodeURIComponent(provider)}`, siteUrl));

  if (!isOAuthProvider(provider) || !isConfigured(provider)) return back("unavailable");

  const state = randomBytes(16).toString("hex");
  (await cookies()).set(OAUTH_STATE_COOKIE, JSON.stringify({ p: provider, s: state, n: next }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth/callback",
    maxAge: 600,
  });
  if (fakeMode()) return NextResponse.redirect(new URL(`/auth/callback/${provider}?code=fake&state=${state}`, siteUrl));
  return NextResponse.redirect(authorizeUrl(provider, state));
}
