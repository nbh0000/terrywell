// 인증 (브라우저). 세션은 PHP 가 서명 쿠키로 관리하고, 화면은 /api/auth/session 으로 확인한다.
// 첫 화면에는 _page.php 가 window.__TW__.session 에 넣어 주므로 요청 없이 바로 안다.

import { apiPost } from "@/lib/api";
import type { SessionInfo } from "@/lib/db/http";
import type { Profile } from "@/lib/db/types";

export type AuthResult = { ok: true } | { ok: false; error: string };

/** 페이지 로더 안에서 던지면 usePageData 가 그 주소로 보낸다 (서버의 redirect() 대신) */
export class RedirectSignal extends Error {
  url: string;
  constructor(url: string) {
    super(`redirect:${url}`);
    this.url = url;
  }
}

let sessionCache: Promise<SessionInfo> | null = null;
const listeners = new Set<() => void>();

const EMPTY: SessionInfo = { user: null, oauth: {}, portone: { storeId: "", channelKey: "", mode: "mock" }, ai: { provider: "mock" } };

export function getSession(force = false): Promise<SessionInfo> {
  if (typeof window === "undefined") return Promise.resolve(EMPTY);
  if (!force && sessionCache) return sessionCache;
  if (!force && window.__TW__?.session) {
    sessionCache = Promise.resolve(window.__TW__.session);
    return sessionCache;
  }
  sessionCache = fetch((process.env.NEXT_PUBLIC_BASE_PATH ?? "") + "/api/auth/session", { credentials: "same-origin", cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<SessionInfo>) : EMPTY))
    .catch(() => EMPTY);
  return sessionCache;
}

/** 로그인·로그아웃 뒤 세션을 다시 읽게 한다 */
export function resetSession() {
  sessionCache = null;
  if (typeof window !== "undefined" && window.__TW__) window.__TW__.session = { ...window.__TW__.session, user: null };
  listeners.forEach((l) => l());
}

export function onSessionChange(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export async function getCurrentUser(): Promise<Profile | null> {
  return (await getSession()).user;
}

/** 로그인이 필요한 화면의 로더에서 호출. 비로그인이면 로그인 페이지로 보낸다 */
export async function requireUser(next: string): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) throw new RedirectSignal(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

// 관리자 화면은 쇼핑몰 로그인과 따로 /admin/login 으로 들어온다
export async function requireAdmin(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new RedirectSignal(`/admin/login?next=${encodeURIComponent(typeof window === "undefined" ? "/admin" : window.location.pathname)}`);
  return user;
}

async function authCall(path: string, body: unknown): Promise<AuthResult & { devLink?: string }> {
  try {
    const r = await apiPost<{ ok: boolean; error?: string; devLink?: string }>(path, body);
    if (r.ok) resetSession();
    return r.ok ? { ok: true, devLink: r.devLink } : { ok: false, error: r.error ?? "실패했습니다." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "요청을 처리하지 못했습니다." };
  }
}

export const signUp = (input: { email: string; password: string; name: string; phone: string }) => authCall("auth/signup", input);
export const signIn = (email: string, password: string) => authCall("auth/login", { email, password });
export const requestPasswordReset = (email: string) => authCall("auth/forgot", { email });
export const resetPassword = (password: string, token?: string) => authCall("auth/reset", { password, token: token ?? "" });
export const changePassword = (current: string, password: string) => authCall("auth/change-password", { current, password });

export async function signOut() {
  await authCall("auth/logout", {});
  resetSession();
}
