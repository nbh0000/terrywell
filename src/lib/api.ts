// PHP API (/api/*) 호출. 서버 액션·API 라우트가 하던 일을 브라우저에서 부른다.

export class ApiError extends Error {
  status: number;
  unauthorized: boolean;
  data: Record<string, unknown>;
  constructor(message: string, status: number, data: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.unauthorized = status === 401 || !!data.unauthorized;
    this.data = data;
  }
}

const base = () => (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + "/api/";

export async function api<T = Record<string, unknown>>(path: string, init: RequestInit = {}): Promise<T> {
  if (typeof window === "undefined") throw new ApiError("브라우저에서만 호출할 수 있습니다.", 0);
  const res = await fetch(base() + path.replace(/^\//, ""), { credentials: "same-origin", cache: "no-store", ...init });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = { error: text.slice(0, 200) };
  }
  if (!res.ok) throw new ApiError(typeof data.error === "string" ? data.error : `요청 실패 (${res.status})`, res.status, data);
  return data as T;
}

export const apiGet = <T = Record<string, unknown>>(path: string) => api<T>(path);

export const apiPost = <T = Record<string, unknown>>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });

export const apiForm = <T = Record<string, unknown>>(path: string, fd: FormData) => api<T>(path, { method: "POST", body: fd });

/** 액션이 돌려주는 {ok,error} 모양으로 바꾼다 (화면 코드가 기존 서버 액션과 같은 모양을 기대한다) */
export async function tryApi<T extends { ok?: boolean; error?: string }>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const message = e instanceof Error ? e.message : "요청을 처리하지 못했습니다.";
    return { ok: false, error: message } as T;
  }
}
