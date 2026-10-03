// 환경 변수 한 곳 정리. 키가 없으면 로컬 모드/목업으로 동작한다.

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Supabase 키가 있으면 supabase, 없으면 .data/db.json 을 쓰는 local */
export const dataMode: "supabase" | "local" = supabaseUrl && supabaseAnonKey ? "supabase" : "local";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
