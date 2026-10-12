import { NextResponse } from "next/server";
import { dataMode, siteUrl } from "@/lib/config";
import { enabledProviders, SUPABASE_NATIVE, type OAuthProviderId } from "@/lib/oauth";
import { createServerSupabase } from "@/lib/supabase/server";

const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/");

// 간편 로그인 시작: 제공자 로그인 화면으로 보낸다. 아직 키가 없으면 로그인 화면으로 돌아가 안내한다
export async function GET(req: Request, ctx: RouteContext<"/auth/oauth/[provider]">) {
  const { provider } = await ctx.params;
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"));
  const back = (reason: string) => NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}&sns=${reason}&provider=${encodeURIComponent(provider)}`, siteUrl));

  const p = provider as OAuthProviderId;
  if (dataMode !== "supabase" || !enabledProviders().includes(p) || !SUPABASE_NATIVE.includes(p)) return back("unavailable");

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: p as "kakao" | "google" | "apple",
    options: { redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) return back("error");
  return NextResponse.redirect(data.url);
}
