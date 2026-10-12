// 간편 로그인 (SNS). Supabase Auth 의 OAuth 를 쓴다.
// 카카오·구글·애플은 Supabase 가 기본 지원한다. 네이버는 Supabase 기본 제공이 아니라 별도 연동이 필요하다.
// 사용할 제공자는 .env 의 NEXT_PUBLIC_OAUTH_PROVIDERS 에 쉼표로 적는다 (예: kakao,google,apple)
// 각 제공자의 키는 Supabase 대시보드 > Authentication > Providers 에 넣는다.

export const OAUTH_PROVIDERS = [
  { id: "kakao", label: "카카오 로그인", bg: "#FEE500", fg: "#191600" },
  { id: "naver", label: "네이버 로그인", bg: "#03C75A", fg: "#ffffff" },
  { id: "google", label: "Google 로그인", bg: "#ffffff", fg: "#1f1f1f" },
  { id: "apple", label: "Apple 로그인", bg: "#000000", fg: "#ffffff" },
] as const;

export type OAuthProviderId = (typeof OAUTH_PROVIDERS)[number]["id"];

/** Supabase 가 기본으로 연결해 주는 제공자 (네이버 제외) */
export const SUPABASE_NATIVE: OAuthProviderId[] = ["kakao", "google", "apple"];

export function enabledProviders(): OAuthProviderId[] {
  const raw = process.env.NEXT_PUBLIC_OAUTH_PROVIDERS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is OAuthProviderId => OAUTH_PROVIDERS.some((p) => p.id === s));
}
