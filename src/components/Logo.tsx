import Link from "next/link";

// 시안 헤더 워드마크. 원본 로고 파일은 해상도가 낮아(public/images/draft/logo-wordmark.png)
// 같은 모양의 Playfair Display 로 그린다. 고객 벡터 로고를 받으면 이미지로 바꾼다.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="TERRYWELL 홈" className={`inline-flex items-center ${className}`}>
      <span className="font-serif text-[1.2rem] font-extrabold leading-none tracking-[0.02em] text-point">TERRYWELL</span>
    </Link>
  );
}
