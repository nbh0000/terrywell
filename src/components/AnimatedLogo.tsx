"use client";

import { useRef } from "react";
import { useInView } from "./Reveal";

// 로고 심볼 선(public/images/draft/logo-footer.png 를 따라 그린 경로). 화면에 들어오면 선이 그려지고 글자가 나타난다
const STROKES = [
  "M29.2 26.2 L63.8 41.5 L92.5 52.4 L112.2 58.3 L116.5 58.9 L120.0 60.7 L129.2 60.8 L132.0 60.3 L135.8 62.4 L142.8 63.0 L150.8 63.2 L162.8 62.2 L171.2 60.1 L178.2 57.1 L184.5 53.4 L188.7 49.8 L190.9 42.8 L190.1 39.8 L189.2 38.3 L187.8 37.5 L182.5 36.3 L170.0 35.8 L163.8 36.4 L154.2 38.6 L146.0 42.3 L137.5 48.2 L135.8 50.5 L133.0 58.5 L118.8 62.2 L116.1 72.5 L106.2 91.0 L100.8 104.5 L98.0 113.0 L95.3 124.0 L94.1 133.0 L93.8 140.2 L94.4 146.5 L95.4 150.8 L99.0 160.2 L100.0 161.9 L101.5 162.6 L105.8 163.0 L207.8 163.0 L209.0 162.5 L209.9 161.2 L212.3 154.2 L213.3 147.5 L211.5 140.2 L209.5 137.6 L206.5 135.7 L200.8 134.3 L195.0 133.8 L143.5 133.8",
  "M100.0 162.5 L96.9 166.7 L93.2 169.3 L89.1 173.3 L86.0 177.8 L83.5 184.0 L82.5 193.5 L84.1 202.5 L85.6 206.2 L88.5 210.8 L91.8 214.1 L95.0 216.6 L101.5 219.6 L109.8 221.1 L116.5 221.5 L263.8 221.5",
  "M209.0 163.2 L210.3 165.5 L212.1 171.0 L213.3 178.2 L211.7 185.5 L209.5 188.2 L207.0 190.0 L199.8 191.6 L193.2 192.2 L140.0 192.5",
];
const STROKE_W = 15.34;
const TEXT_TOP = 257; // 원본 308px 기준 TERRYWELL 글자 시작 높이

// 획마다 길이에 맞춘 시간으로 차례로 그린다 (앞 획이 거의 끝날 때 다음 획 시작)
const DURATIONS = [1.5, 0.7, 0.5];
const DELAYS = DURATIONS.reduce<number[]>((acc, d, i) => [...acc, i === 0 ? 0.15 : acc[i - 1] + DURATIONS[i - 1] * 0.92], []);
const TEXT_DELAY = DELAYS[DELAYS.length - 1] + DURATIONS[DURATIONS.length - 1] * 0.92;

export function AnimatedLogo({ className = "", color = "#4c78bb", textSrc = "/images/draft/logo-footer.png" }: { className?: string; color?: string; textSrc?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, 0.3);
  return (
    <div ref={ref} className={`tw-reveal relative aspect-square ${className}`} role="img" aria-label="TERRYWELL">
      <svg viewBox="0 0 308 308" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        {STROKES.map((d, i) => (
          <path
            key={i}
            d={d}
            pathLength={1}
            strokeDasharray="1 1"
            fill="none"
            stroke={color}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: `stroke-dashoffset ${DURATIONS[i] ?? 0.6}s cubic-bezier(0.55, 0, 0.35, 1) ${DELAYS[i] ?? 0}s`, strokeDashoffset: on ? 0 : 1 }}
          />
        ))}
      </svg>
      {/* 워드마크는 원본 이미지의 글자 부분만 보여 준다 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={textSrc}
        alt=""
        className="absolute inset-0 h-full w-full transition-all duration-700 ease-out"
        style={{ clipPath: `inset(${(TEXT_TOP / 308) * 100}% 0 0 0)`, opacity: on ? 1 : 0, transform: on ? "none" : "translateY(6px)", transitionDelay: on ? `${TEXT_DELAY}s` : "0s" }}
      />
    </div>
  );
}
