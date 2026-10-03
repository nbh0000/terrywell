import type { Metadata, Viewport } from "next";
import { Noto_Serif_KR, Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";

// 히어로 TERRYWELL 글자: 시안 워드마크와 같은 굵은 디돈 세리프
const logo = Playfair_Display({ variable: "--font-logo", weight: ["700", "800", "900"], subsets: ["latin"] });
// 푸터 대표 전화 숫자: 시안의 세리프 숫자
const footerNum = Noto_Serif_KR({ variable: "--font-footer-num", weight: ["400"], subsets: ["latin"] });
// 카드 라벨 등 영문 표기
const poppins = Poppins({ variable: "--font-poppins", weight: ["300", "400", "500", "600"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "TERRYWELL", template: "%s | TERRYWELL" },
  description: "A Better Everyday, Woven into Every Towel. 커스텀 라벨 수건 테리웰",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f5f6f6" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${logo.variable} ${poppins.variable} ${footerNum.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
