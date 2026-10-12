"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/** 오른쪽 아래 위로 가기 버튼. 조금 내려왔을 때만 보인다 */
export function ScrollTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 480);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <button
      type="button"
      aria-label="맨 위로"
      onClick={() => window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
      className={`fixed bottom-5 right-5 z-40 grid size-11 place-items-center rounded-full border border-line bg-white/95 text-ink shadow-[0_2px_10px_rgba(36,26,24,0.10)] backdrop-blur transition-all duration-300 hover:border-point hover:text-point md:bottom-8 md:right-8 ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
    >
      <ArrowUp size={19} strokeWidth={1.7} />
    </button>
  );
}
