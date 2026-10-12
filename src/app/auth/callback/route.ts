import { NextResponse } from "next/server";
import { dataMode, siteUrl } from "@/lib/config";
import { createServerSupabase } from "@/lib/supabase/server";

// 간편 로그인 · 이메일 확인 뒤 돌아오는 곳. 받은 code 로 세션을 만든다 (회원 프로필은 DB 트리거가 만든다)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const n = url.searchParams.get("next");
  const next = n && n.startsWith("/") && !n.startsWith("//") ? n : "/";
  if (dataMode !== "supabase" || !code) return NextResponse.redirect(new URL("/login", siteUrl));
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}&sns=error`, siteUrl));
  return NextResponse.redirect(new URL(next, siteUrl));
}
