// 간편 로그인 (SNS) 제공자 목록. 클라이언트에서도 쓰므로 키·서버 로직은 oauth-server.ts 에 둔다.
// 카카오·네이버·구글은 사이트가 직접 OAuth 를 처리한다 (Supabase 를 거치지 않으므로 로컬 모드에서도 동작).
//   시작:   /auth/oauth/{provider}
//   콜백:   /auth/callback/{provider}   ← 각 개발자 콘솔에 등록하는 Redirect/Callback URL
// 키는 .env 의 KAKAO_CLIENT_ID 처럼 {PROVIDER}_CLIENT_ID / {PROVIDER}_CLIENT_SECRET 에 넣는다. 키가 없으면 '연결되지 않음' 안내.

export const OAUTH_PROVIDERS = [
  { id: "kakao", label: "카카오 로그인", bg: "#FEE500", fg: "#191600" },
  { id: "naver", label: "네이버 로그인", bg: "#03C75A", fg: "#ffffff" },
  { id: "google", label: "Google 로그인", bg: "#ffffff", fg: "#1f1f1f" },
  { id: "apple", label: "Apple 로그인", bg: "#000000", fg: "#ffffff" },
] as const;

export type OAuthProviderId = (typeof OAUTH_PROVIDERS)[number]["id"];

export const isOAuthProvider = (s: string): s is OAuthProviderId => OAUTH_PROVIDERS.some((p) => p.id === s);
