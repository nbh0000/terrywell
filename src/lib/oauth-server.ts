import "server-only";
import { siteUrl } from "@/lib/config";
import type { OAuthProviderId } from "./oauth";

// 간편 로그인 서버 로직: 제공자 로그인 화면 주소 만들기, code → 토큰 → 회원 정보 조회.
// Apple 은 키(팀 ID·서비스 ID·개인 키)가 아직 없어 연결하지 않았다.

export interface SnsProfile {
  provider: OAuthProviderId;
  id: string; // 제공자 쪽 회원 고유 번호
  email: string | null; // 동의하지 않으면 null
  name: string;
  phone: string;
}

const env = (k: string) => process.env[k]?.trim() ?? "";

export function providerKeys(p: OAuthProviderId) {
  const P = p.toUpperCase();
  return { id: env(`${P}_CLIENT_ID`), secret: env(`${P}_CLIENT_SECRET`) };
}

/** 개발 확인용: OAUTH_FAKE=1 이면 제공자에 가지 않고 가짜 회원으로 바로 로그인된다 (운영 빌드에서는 무시) */
export const fakeMode = () => process.env.NODE_ENV !== "production" && process.env.OAUTH_FAKE === "1";

export function isConfigured(p: OAuthProviderId) {
  if (p === "apple") return false;
  if (fakeMode()) return true;
  const { id, secret } = providerKeys(p);
  return Boolean(id && secret);
}

export const redirectUri = (p: OAuthProviderId) => `${siteUrl}/auth/callback/${p}`;

const qs = (o: Record<string, string>) => new URLSearchParams(o).toString();

export function authorizeUrl(p: OAuthProviderId, state: string): string {
  const { id } = providerKeys(p);
  const ru = redirectUri(p);
  switch (p) {
    case "kakao":
      return `https://kauth.kakao.com/oauth/authorize?${qs({ client_id: id, redirect_uri: ru, response_type: "code", state })}`;
    case "naver":
      return `https://nid.naver.com/oauth2.0/authorize?${qs({ response_type: "code", client_id: id, redirect_uri: ru, state })}`;
    case "google":
      return `https://accounts.google.com/o/oauth2/v2/auth?${qs({ client_id: id, redirect_uri: ru, response_type: "code", scope: "openid email profile", state, prompt: "select_account" })}`;
    default:
      throw new Error(`지원하지 않는 제공자: ${p}`);
  }
}

export function fakeProfile(p: OAuthProviderId): SnsProfile {
  return { provider: p, id: "fake-1", email: `${p}.test@example.com`, name: "테스트 회원", phone: "" };
}

/** 콜백으로 받은 code 로 토큰을 받고 회원 정보를 가져온다 */
export async function fetchProfile(p: OAuthProviderId, code: string, state: string): Promise<SnsProfile> {
  const { id, secret } = providerKeys(p);
  const ru = redirectUri(p);
  if (p === "kakao") {
    const tok = await postForm("https://kauth.kakao.com/oauth/token", { grant_type: "authorization_code", client_id: id, client_secret: secret, redirect_uri: ru, code });
    const me = await getJson("https://kapi.kakao.com/v2/user/me", tok.access_token);
    const acc = (me.kakao_account ?? {}) as Record<string, unknown>;
    const profile = (acc.profile ?? {}) as Record<string, unknown>;
    return { provider: p, id: String(me.id), email: str(acc.email) || null, name: str(profile.nickname) || str(acc.name), phone: normalizePhone(str(acc.phone_number)) };
  }
  if (p === "naver") {
    const tok = await postForm("https://nid.naver.com/oauth2.0/token", { grant_type: "authorization_code", client_id: id, client_secret: secret, code, state });
    const body = await getJson("https://openapi.naver.com/v1/nid/me", tok.access_token);
    const me = (body.response ?? {}) as Record<string, unknown>;
    if (!me.id) throw new Error(`naver: ${str(body.message) || "회원 정보 없음"}`);
    return { provider: p, id: String(me.id), email: str(me.email) || null, name: str(me.name) || str(me.nickname), phone: normalizePhone(str(me.mobile)) };
  }
  if (p === "google") {
    const tok = await postForm("https://oauth2.googleapis.com/token", { grant_type: "authorization_code", client_id: id, client_secret: secret, redirect_uri: ru, code });
    const me = await getJson("https://www.googleapis.com/oauth2/v3/userinfo", tok.access_token);
    return { provider: p, id: String(me.sub), email: str(me.email) || null, name: str(me.name), phone: "" };
  }
  throw new Error(`지원하지 않는 제공자: ${p}`);
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** 카카오 "+82 10-1234-5678", 네이버 "010-1234-5678" 를 010-1234-5678 로 */
function normalizePhone(raw: string) {
  if (!raw) return "";
  let s = raw.replace(/[^\d+]/g, "");
  if (s.startsWith("+82")) s = "0" + s.slice(3);
  return s.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
}

async function postForm(url: string, body: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: qs(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof json.access_token !== "string") {
    throw new Error(`token ${res.status}: ${str(json.error_description) || str(json.error) || "실패"}`);
  }
  return json as { access_token: string };
}

async function getJson(url: string, accessToken: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`profile ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}
