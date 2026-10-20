"use client";

import Link from "next/link";
import { OAUTH_PROVIDERS } from "@/lib/oauth";
import { useQuery } from "@/lib/page";
import { AuthCard } from "../AuthCard";
import { SnsLogin } from "./SnsLogin";
import { LoginForm } from "./LoginForm";

export function LoginClient() {
  const q = useQuery();
  const next = q?.get("next") || "/";
  const sns = q?.get("sns");
  const provider = OAUTH_PROVIDERS.find((p) => p.id === q?.get("provider"))?.label.replace(" 로그인", "") ?? "간편";
  const snsNotice =
    sns === "unavailable"
      ? `${provider} 로그인은 아직 연결되지 않았습니다. 이메일로 로그인해 주세요.`
      : sns === "cancel"
        ? `${provider} 로그인을 취소했습니다.`
        : sns === "error"
          ? `${provider} 로그인을 마치지 못했습니다. 잠시 후 다시 시도해 주세요.`
          : null;
  return (
    <AuthCard title="로그인">
      <LoginForm next={next} notice={q?.get("reset") ? "비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요." : undefined} />
      <SnsLogin next={next} notice={snsNotice} />
      <div className="mt-8 border-t border-line pt-6 text-center">
        <p className="text-[13px] text-muted">로그인 없이 주문번호와 연락처로 주문 상태를 확인할 수 있습니다.</p>
        <Link href="/order-lookup" className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-[6px] border border-ink/70 text-[14.5px] hover:bg-tile">비회원 주문 조회</Link>
      </div>
    </AuthCard>
  );
}
