import type { Metadata } from "next";
import { AboutClient } from "./AboutClient";

export const metadata: Metadata = { title: "회사 소개" };

export default function AboutPage() {
  return <AboutClient />;
}
