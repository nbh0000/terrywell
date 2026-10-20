import type { Metadata } from "next";
import { WishlistClient } from "./WishlistClient";

export const metadata: Metadata = { title: "찜 목록" };

export default function WishlistPage() {
  return <WishlistClient />;
}
