import type { Metadata, Viewport } from "next";
import { Libre_Caslon_Text, Poppins } from "next/font/google";
import "./globals.css";

// 로고 파일을 받기 전까지 쓰는 세리프 워드마크용
const logo = Libre_Caslon_Text({ variable: "--font-logo", weight: ["400", "700"], subsets: ["latin"] });
// 카드 라벨 등 영문 표기
const poppins = Poppins({ variable: "--font-poppins", weight: ["400", "500", "600"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "TERRYWELL", template: "%s | TERRYWELL" },
  description: "A Better Everyday, Woven into Every Towel. 커스텀 라벨 수건 테리웰",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${logo.variable} ${poppins.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
