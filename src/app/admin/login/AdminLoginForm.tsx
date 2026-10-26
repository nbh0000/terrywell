"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getCurrentUser, getSession, signIn, signOut } from "@/lib/auth";
import { getQuery } from "@/lib/page";

// 관리자 전용 로그인. 쇼핑몰 로그인(/login)과 따로 두고, 관리자 계정만 들어간다
function nextUrl() {
  const n = getQuery().get("next") ?? "";
  return n.startsWith("/admin") && !n.startsWith("/admin/login") ? n : "/admin";
}

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // 이미 관리자로 로그인해 있으면 바로 관리자 화면으로
  useEffect(() => {
    getCurrentUser().then((u) => u?.role === "admin" && window.location.replace(nextUrl())).catch(() => {});
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !password) return setError("이메일과 비밀번호를 입력해 주세요.");
    setError("");
    setBusy(true);
    let ok = false;
    try {
      const r = await signIn(email.trim(), password);
      if (!r.ok) return setError(r.error);
      const s = await getSession(true);
      if (s.user?.role !== "admin") {
        await signOut();
        return setError("관리자 계정이 아닙니다.");
      }
      ok = true;
    } catch {
      setError("로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
    if (ok) window.location.assign(nextUrl());
  }

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-[#f3f3f1] px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 text-center">
          <p className="font-serif text-[26px] font-extrabold tracking-[0.02em] text-point">TERRYWELL</p>
          <p className="mt-1 text-[13px] text-muted">관리자 센터</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-[6px] border border-line bg-white p-6 sm:p-8">
          <label className="block">
            <span className="mb-1.5 block text-[13px] text-ink/80">이메일</span>
            <input name="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full rounded-[3px] border border-line px-3.5 text-[15px] outline-none focus:border-ink/50" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] text-ink/80">비밀번호</span>
            <input name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full rounded-[3px] border border-line px-3.5 text-[15px] outline-none focus:border-ink/50" />
          </label>
          {error && <p role="alert" className="text-sm text-alert">{error}</p>}
          <button type="submit" disabled={busy} className="h-12 w-full rounded-[3px] bg-ink text-[15px] font-medium text-white transition-colors hover:bg-ink/85 disabled:opacity-60">
            {busy ? "확인 중…" : "로그인"}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-muted">관리자 계정으로만 들어갈 수 있습니다.</p>
      </div>
    </main>
  );
}
