import type { NextConfig } from "next";

// GitHub Pages 미리보기 빌드에서만 /terrywell 아래로 서비스한다 (scripts/export_pages.py)
const basePath = process.env.NEXT_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  basePath,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    serverActions: {
      // 라벨 디자인 저장(디자인 JSON + 인쇄용 300dpi PNG + 사진), PDF 업로드(최대 50MB)
      bodySizeLimit: "60mb",
    },
  },
  // sharp 는 네이티브 모듈이라 번들하지 않는다
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
