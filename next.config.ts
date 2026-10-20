import type { NextConfig } from "next";

// 카페24(PHP 호스팅) 배포: 화면은 정적 HTML 로 내보내고(output: export), 데이터·저장·인증은 PHP API(/api/*)가 맡는다.
// 개발 중에는 /api, /uploads, 간편 로그인 주소를 로컬 Apache+PHP(TW_API_ORIGIN, 기본 8090)로 넘긴다. 빌드: python cafe24/build.py
const isExport = process.env.TW_EXPORT === "1";
const apiOrigin = process.env.TW_API_ORIGIN ?? "http://localhost:8090";

const nextConfig: NextConfig = {
  ...(isExport ? { output: "export" as const } : {}),
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: "" },
  distDir: process.env.NEXT_DIST_DIR || ".next",
  ...(isExport
    ? {}
    : {
        async rewrites() {
          return [
            { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
            { source: "/uploads/:path*", destination: `${apiOrigin}/uploads/:path*` },
            { source: "/auth/oauth/:provider", destination: `${apiOrigin}/auth/oauth/:provider` },
            { source: "/auth/callback/:provider", destination: `${apiOrigin}/auth/callback/:provider` },
          ];
        },
      }),
};

export default nextConfig;
