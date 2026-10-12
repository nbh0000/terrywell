"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** 화면에 들어오면 아래에서 살짝 떠오르며 나타난다. 움직임 줄이기 설정이면 움직임 없이 바로 (globals.css .tw-reveal) */
export function Reveal({ as = "div", delay = 0, className = "", children }: { as?: "div" | "p"; delay?: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement & HTMLParagraphElement>(null);
  const on = useInView(ref);
  const props = {
    ref,
    className: `tw-reveal transition-all duration-700 ease-out ${on ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"} ${className}`,
    style: { transitionDelay: on ? `${delay}s` : "0s" },
  };
  return as === "p" ? <p {...props}>{children}</p> : <div {...props}>{children}</div>;
}

/** 요소가 한 번이라도 화면에 들어왔는지 */
export function useInView(ref: React.RefObject<Element | null>, threshold = 0.2) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return on;
}
