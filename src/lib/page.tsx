"use client";

// 정적 내보내기(카페24) 화면 공통: 데이터 로딩 훅, 주소에서 값 읽기, 이동.
// 서버 컴포넌트가 하던 "await 로 데이터를 받아 그린다"를 브라우저에서 같은 모양으로 한다.

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { RedirectSignal, getSession, onSessionChange } from "@/lib/auth";
import type { SessionInfo } from "@/lib/db/http";

export interface PageState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * 화면 데이터 로더. 로더가 RedirectSignal 을 던지면 그 주소로 이동하고, 401 이면 로그인으로 보낸다.
 * deps 가 바뀌면 다시 읽는다. enabled 가 false 면 기다린다 (주소 값이 아직 없을 때).
 */
export function usePageData<T>(loader: () => Promise<T>, deps: unknown[] = [], enabled = true): PageState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 로더 시작 표시 (외부 데이터 동기화)
    setLoading(true);
    loader()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(null);
      })
      .catch((e) => {
        if (!alive) return;
        if (e instanceof RedirectSignal) {
          window.location.replace(e.url);
          return;
        }
        if (e instanceof ApiError && e.unauthorized) {
          window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }
        setError(e instanceof Error ? e.message : "불러오지 못했습니다.");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tick, ...deps]);
  return { data, error, loading, reload };
}

/** 주소의 마지막 조각 (products/[slug], notices/[id] 등). 정적 내보내기에서는 useParams 가 __live 를 주므로 주소에서 읽는다 */
export function useRouteId(): string | null {
  const pathname = usePathname();
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    const seg = window.location.pathname.replace(/\/+$/, "").split("/").pop() ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 주소(외부 시스템)를 읽어 온다
    setId(decodeURIComponent(seg.replace(/\.html$/, "")));
  }, [pathname]);
  return id;
}

/** 주소의 ?query 값 (useSearchParams 는 정적 내보내기에서 Suspense 를 요구해 직접 읽는다) */
export function useQuery(): URLSearchParams | null {
  const pathname = usePathname();
  const [q, setQ] = useState<URLSearchParams | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 주소(외부 시스템)를 읽어 온다
    setQ(new URLSearchParams(window.location.search));
  }, [pathname]);
  return q;
}

/** 지금 주소의 ?query (이벤트 핸들러·로더 안에서) */
export const getQuery = () => new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);

/** 서버 액션의 redirect() 대신: 페이지를 통째로 이동한다 (세션·스냅샷도 새로 받는다) */
export function go(url: string): never {
  window.location.assign(url);
  throw new RedirectSignal(url);
}

export function useSession(): SessionInfo | null {
  const [s, setS] = useState<SessionInfo | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => getSession().then((v) => alive && setS(v));
    load();
    const off = onSessionChange(load);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return s;
}

export function Loading({ className = "" }: { className?: string }) {
  return (
    <div className={`flex min-h-[40vh] items-center justify-center text-[13px] text-muted ${className}`} aria-live="polite">
      불러오는 중…
    </div>
  );
}

export function NotFound({ title = "페이지를 찾을 수 없습니다.", children }: { title?: string; children?: ReactNode }) {
  return (
    <section className="mx-auto flex min-h-[50vh] w-full max-w-[720px] flex-col items-center justify-center px-5 text-center">
      <p className="text-[16px]">{title}</p>
      {children}
      <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-[6px] border border-ink/70 px-5 text-[14px] hover:bg-tile">처음 화면으로</Link>
    </section>
  );
}

export function PageError({ message }: { message: string }) {
  return <p className="px-5 py-16 text-center text-[14px] text-red-600">{message}</p>;
}
