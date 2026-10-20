import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signInWithSns } from "@/lib/auth";
import { siteUrl } from "@/lib/config";
import { isOAuthProvider } from "@/lib/oauth";
import { OAUTH_STATE_COOKIE } from "@/lib/oauth-cookie";
import { fakeMode, fakeProfile, fetchProfile } from "@/lib/oauth-server";

// 간편 로그인 콜백 (카카오·네이버·구글 콘솔에 등록하는 주소: {사이트}/auth/callback/{provider}).
// state 쿠키를 확인한 뒤 code 로 회원 정보를 받아 로그인시킨다.
export async function GET(req: Request, ctx: RouteContext<"/auth/callback/[provider]">) {
  const { provider } = await ctx.params;
  const url = new URL(req.url);
  const jar = await cookies();
  const raw = jar.get(OAUTH_STATE_COOKIE)?.value;
  jar.delete({ name: OAUTH_STATE_COOKIE, path: "/auth/callback" });

  let saved: { p?: string; s?: string; n?: string } = {};
  try {
    saved = raw ? JSON.parse(raw) : {};
  } catch {
    saved = {};
  }
  const next = saved.n && saved.n.startsWith("/") && !saved.n.startsWith("//") ? saved.n : "/";
  const back = (reason: string) =>
    NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}&sns=${reason}&provider=${encodeURIComponent(provider)}`, siteUrl));

  if (!isOAuthProvider(provider)) return back("unavailable");
  if (url.searchParams.get("error")) return back("cancel"); // 사용자가 동의 화면에서 취소
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";
  if (!code || !state || saved.p !== provider || saved.s !== state) return back("error");

  try {
    const profile = fakeMode() ? fakeProfile(provider) : await fetchProfile(provider, code, state);
    const r = await signInWithSns(profile);
    if (!r.ok) {
      console.error(`[sns ${provider}]`, r.error);
      return back("error");
    }
  } catch (e) {
    console.error(`[sns ${provider}]`, e);
    return back("error");
  }
  return NextResponse.redirect(new URL(next, siteUrl));
}
