import Link from "next/link";
import { IMAGES } from "@/content/images";

// 고객 로고 파일(IMAGES.logo)을 받으면 이미지로, 그 전에는 세리프 워드마크 글자로 표시한다.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="TERRYWELL 홈" className={`inline-flex items-center ${className}`}>
      {IMAGES.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={IMAGES.logo} alt="TERRYWELL" className="h-6 w-auto" />
      ) : (
        <span className="font-serif text-[1.35rem] font-bold leading-none tracking-[0.06em] text-point">TERRYWELL</span>
      )}
    </Link>
  );
}
