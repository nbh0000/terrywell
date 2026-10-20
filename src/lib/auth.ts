import "server-only";
import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { dataMode, siteUrl } from "@/lib/config";
import { getDb } from "@/lib/db";
import { loadStore, persist } from "@/lib/db/local";
import type { Profile } from "@/lib/db/types";
import { OAUTH_PROVIDERS } from "@/lib/oauth";
import type { SnsProfile } from "@/lib/oauth-server";
import { createAdminClient, createServerSupabase } from "@/lib/supabase/server";

// 인증: Supabase 모드는 Supabase Auth, 로컬 모드는 .data/db.json + 서명 쿠키.

const SESSION_COOKIE = "tw_session";
const SESSION_DAYS = 14;

export type AuthResult = { ok: true } | { ok: false; error: string };

// ───────── 공통 ─────────

export async function getCurrentUser(): Promise<Profile | null> {
  if (dataMode === "supabase") {
    const supabase = await createServerSupabase();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return getDb().get("profiles", { id: data.user.id });
  }
  const userId = await readLocalSession();
  if (!userId) return null;
  return getDb().get("profiles", { id: userId });
}

/** 로그인이 필요한 페이지에서 호출. 비로그인이면 로그인 페이지로 보낸다. */
export async function requireUser(next: string): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin(): Promise<Profile> {
  const user = await requireUser("/admin");
  if (user.role !== "admin") redirect("/");
  return user;
}

export async function signUp(input: { email: string; password: string; name: string; phone: string }): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (dataMode === "supabase") {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: { data: { name: input.name, phone: input.phone }, emailRedirectTo: `${siteUrl}/login` },
    });
    return error ? { ok: false, error: translate(error.message) } : { ok: true };
  }
  const store = await loadStore();
  if (store._auth_users.some((u) => u.email === email)) return { ok: false, error: "이미 가입된 이메일입니다." };
  const id = randomUUID();
  store._auth_users.push({ id, email, password_hash: hashPassword(input.password) });
  await persist();
  await getDb().insert("profiles", { id, email, name: input.name, phone: input.phone, role: "customer", company_name: "", business_number: "" });
  await writeLocalSession(id);
  return { ok: true };
}

export async function signIn(emailRaw: string, password: string): Promise<AuthResult> {
  const email = emailRaw.trim().toLowerCase();
  if (dataMode === "supabase") {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { ok: false, error: translate(error.message) } : { ok: true };
  }
  const store = await loadStore();
  const user = store._auth_users.find((u) => u.email === email);
  if (user && !user.password_hash && user.sns) {
    const label = OAUTH_PROVIDERS.find((p) => p.id === user.sns!.provider)?.label ?? "간편 로그인";
    return { ok: false, error: `${label}으로 가입한 계정입니다. 아래 간편 로그인 버튼을 눌러 주세요.` };
  }
  if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) return { ok: false, error: "이메일 또는 비밀번호가 맞지 않습니다." };
  await writeLocalSession(user.id);
  return { ok: true };
}

export async function signOut() {
  if (dataMode === "supabase") {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
    return;
  }
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * 비밀번호 재설정 메일 요청.
 * 로컬 모드는 메일을 보낼 수 없어 재설정 링크를 반환한다 (개발 확인용).
 */
export async function requestPasswordReset(emailRaw: string): Promise<AuthResult & { devLink?: string }> {
  const email = emailRaw.trim().toLowerCase();
  if (dataMode === "supabase") {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/reset-password` });
    return error ? { ok: false, error: translate(error.message) } : { ok: true };
  }
  const store = await loadStore();
  const user = store._auth_users.find((u) => u.email === email);
  if (!user) return { ok: true }; // 가입 여부를 노출하지 않는다
  user.reset_token = randomBytes(24).toString("hex");
  user.reset_expires = Date.now() + 30 * 60 * 1000;
  await persist();
  return { ok: true, devLink: `/reset-password?token=${user.reset_token}` };
}

export async function resetPassword(password: string, token?: string): Promise<AuthResult> {
  if (dataMode === "supabase") {
    // 메일 링크로 들어오면 Supabase 가 세션을 만들어 둔 상태다
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.updateUser({ password });
    return error ? { ok: false, error: translate(error.message) } : { ok: true };
  }
  const store = await loadStore();
  const user = store._auth_users.find((u) => u.reset_token && u.reset_token === token);
  if (!user || !user.reset_expires || user.reset_expires < Date.now()) return { ok: false, error: "링크가 만료되었습니다. 다시 요청해 주세요." };
  user.password_hash = hashPassword(password);
  delete user.reset_token;
  delete user.reset_expires;
  await persist();
  return { ok: true };
}

/**
 * 간편 로그인(카카오·네이버·구글)으로 받은 회원 정보로 로그인한다. 처음이면 회원을 만든다.
 * 같은 이메일로 이미 가입한 계정이 있으면 그 계정으로 로그인한다 (제공자가 확인한 이메일).
 * 이메일 제공에 동의하지 않은 경우 {provider}.{id}@sns.terrywell.kr 형식의 내부용 주소를 쓴다.
 */
export async function signInWithSns(sns: SnsProfile): Promise<AuthResult> {
  const email = (sns.email ?? `${sns.provider}.${sns.id}@sns.terrywell.kr`).trim().toLowerCase();
  const providerLabel = OAUTH_PROVIDERS.find((p) => p.id === sns.provider)?.label.replace(" 로그인", "") ?? "SNS";
  const name = sns.name || `${providerLabel} 회원`;

  if (dataMode === "supabase") {
    const admin = createAdminClient();
    // 이미 있으면 "already registered" 류 오류가 나고, 그대로 그 계정으로 진행한다 (회원 프로필은 DB 트리거가 만든다)
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name, phone: sns.phone, sns_provider: sns.provider, sns_id: sns.id },
    });
    if (createError && createError.code !== "email_exists" && !/already|exist|registered/i.test(createError.message)) {
      return { ok: false, error: translate(createError.message) };
    }
    // 비밀번호 없이 세션을 만들기 위해 매직링크 토큰을 서버에서 바로 검증한다
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = link?.properties?.hashed_token;
    if (linkError || !tokenHash) return { ok: false, error: translate(linkError?.message ?? "토큰 생성 실패") };
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
    return error ? { ok: false, error: translate(error.message) } : { ok: true };
  }

  const store = await loadStore();
  let user =
    store._auth_users.find((u) => u.sns?.provider === sns.provider && u.sns.id === sns.id) ??
    store._auth_users.find((u) => u.email === email);
  if (!user) {
    user = { id: randomUUID(), email, password_hash: "", sns: { provider: sns.provider, id: sns.id } };
    store._auth_users.push(user);
    await persist();
    await getDb().insert("profiles", { id: user.id, email, name, phone: sns.phone, role: "customer", company_name: "", business_number: "" });
  } else if (!user.sns) {
    user.sns = { provider: sns.provider, id: sns.id };
    await persist();
  }
  await writeLocalSession(user.id);
  return { ok: true };
}

// ───────── 로컬 모드 내부 ─────────

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(password, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

let secretCache: string | null = null;
async function sessionSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (secretCache) return secretCache;
  const file = path.join(process.cwd(), ".data", "session-secret");
  try {
    secretCache = (await fs.readFile(file, "utf8")).trim();
  } catch {
    secretCache = randomBytes(32).toString("hex");
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, secretCache);
  }
  return secretCache;
}

async function sign(payload: string) {
  return createHmac("sha256", await sessionSecret()).update(payload).digest("base64url");
}

async function writeLocalSession(userId: string) {
  const exp = Date.now() + SESSION_DAYS * 86400_000;
  const payload = `${userId}.${exp}`;
  (await cookies()).set(SESSION_COOKIE, `${payload}.${await sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

async function readLocalSession(): Promise<string | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [userId, exp, sig] = raw.split(".");
  if (!userId || !exp || !sig) return null;
  const expected = await sign(`${userId}.${exp}`);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Number(exp) < Date.now()) return null;
  return userId;
}

/**
 * 로컬 모드 관리자 계정. 없으면 만들고, 접속 정보를 .data/admin-login.txt 에 적어 둔다.
 */
export async function ensureLocalAdmin() {
  if (dataMode !== "local") return;
  const store = await loadStore();
  if (store.profiles.some((p) => p.role === "admin")) return;
  const id = randomUUID();
  const email = "admin@terrywell.local";
  const password = randomBytes(9).toString("base64url");
  store._auth_users.push({ id, email, password_hash: hashPassword(password) });
  await persist();
  await getDb().insert("profiles", { id, email, name: "관리자", phone: "", role: "admin", company_name: "", business_number: "" });
  await fs.writeFile(
    path.join(process.cwd(), ".data", "admin-login.txt"),
    `로컬 개발용 관리자 계정\nemail: ${email}\npassword: ${password}\n`,
  );
}

function translate(message: string) {
  if (/invalid login credentials/i.test(message)) return "이메일 또는 비밀번호가 맞지 않습니다.";
  if (/already registered/i.test(message)) return "이미 가입된 이메일입니다.";
  if (/password should be at least/i.test(message)) return "비밀번호는 8자 이상이어야 합니다.";
  if (/email not confirmed/i.test(message)) return "메일함에서 가입 인증을 먼저 완료해 주세요.";
  return message;
}
