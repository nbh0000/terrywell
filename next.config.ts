import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
