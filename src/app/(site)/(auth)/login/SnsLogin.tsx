import { OAUTH_PROVIDERS, type OAuthProviderId } from "@/lib/oauth";

// 간편 로그인 버튼. 키가 연결되지 않은 제공자는 누르면 로그인 화면에 안내가 뜬다
export function SnsLogin({ next, notice }: { next: string; notice: string | null }) {
  return (
    <div className="mt-10">
      <div className="flex items-center gap-3 text-[12.5px] text-muted">
        <span className="h-px flex-1 bg-line" />
        간편 로그인
        <span className="h-px flex-1 bg-line" />
      </div>
      {notice && <p role="alert" className="mt-3 rounded-[6px] bg-tile px-3 py-2.5 text-center text-[13px] text-ink/80">{notice}</p>}
      <div className="mt-4 grid gap-2">
        {OAUTH_PROVIDERS.map((p) => (
          <a
            key={p.id}
            href={`/auth/oauth/${p.id}?next=${encodeURIComponent(next)}`}
            className="relative flex h-12 items-center justify-center rounded-[6px] text-[14.5px] font-medium transition-[filter] hover:brightness-[0.97]"
            style={{ background: p.bg, color: p.fg, border: p.id === "google" ? "1px solid var(--color-line)" : undefined }}
          >
            <span className="absolute left-4"><ProviderMark id={p.id} /></span>
            {p.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function ProviderMark({ id }: { id: OAuthProviderId }) {
  switch (id) {
    case "kakao":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
          <path fill="#191600" d="M12 3.5C6.75 3.5 2.5 6.86 2.5 11c0 2.66 1.75 5 4.4 6.34l-.9 3.3c-.08.3.26.54.52.37l3.94-2.6c.5.06 1 .09 1.54.09 5.25 0 9.5-3.36 9.5-7.5S17.25 3.5 12 3.5Z" />
        </svg>
      );
    case "naver":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path fill="#fff" d="M16.27 12.84 7.46 0H0v24h7.73V11.16L16.54 24H24V0h-7.73z" />
        </svg>
      );
    case "google":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81Z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.3v3.1A12 12 0 0 0 12 24Z" />
          <path fill="#FBBC05" d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.3a12 12 0 0 0 0 10.76l3.99-3.1Z" />
          <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.3 6.62l3.99 3.1C6.23 6.88 8.88 4.77 12 4.77Z" />
        </svg>
      );
    case "apple":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path fill="#fff" d="M16.37 12.73c-.03-2.64 2.16-3.91 2.26-3.97-1.23-1.8-3.15-2.05-3.83-2.08-1.63-.17-3.18.96-4.01.96-.83 0-2.1-.94-3.46-.91a5.13 5.13 0 0 0-4.34 2.63c-1.85 3.21-.47 7.96 1.33 10.56.88 1.27 1.93 2.7 3.3 2.65 1.33-.05 1.83-.86 3.43-.86 1.6 0 2.05.86 3.45.83 1.43-.03 2.33-1.29 3.2-2.57a11.3 11.3 0 0 0 1.45-2.98c-.03-.01-2.78-1.07-2.8-4.26ZM13.73 4.98c.73-.89 1.22-2.11 1.09-3.34-1.05.04-2.33.7-3.08 1.58-.67.78-1.27 2.04-1.11 3.24 1.18.09 2.37-.6 3.1-1.48Z" />
        </svg>
      );
  }
}
