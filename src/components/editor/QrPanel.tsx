"use client";

import { useEffect, useState } from "react";
import type { EditorApi } from "./Editor";

type Mode = "qr" | "barcode";

const COLORS = ["#221817", "#1c2c77", "#3167a7", "#457f71", "#a5294e"];

// QR 코드 · 바코드 만들기. 벡터(SVG)로 넣어서 인쇄해도 깨지지 않는다 (외부 서비스 호출 없음)
export function QrPanel({ ed }: { ed: EditorApi }) {
  const [mode, setMode] = useState<Mode>("qr");
  const [value, setValue] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [svg, setSvg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const v = value.trim();
    if (!v) return;
    const t = setTimeout(async () => {
      try {
        const out = mode === "qr" ? await makeQr(v, color) : await makeBarcode(v, color);
        if (alive) {
          setSvg(out);
          setErr(null);
        }
      } catch (e) {
        if (alive) {
          setSvg(null);
          setErr(e instanceof Error ? e.message : "만들지 못했습니다.");
        }
      }
    }, 200);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [mode, value, color]);

  const shown = value.trim() ? svg : null;
  const shownErr = value.trim() ? err : null;
  const tab = (m: Mode, label: string) => (
    <button type="button" onClick={() => setMode(m)} aria-pressed={mode === m} className={`h-9 flex-1 rounded-[6px] text-[13.5px] ${mode === m ? "bg-white font-medium shadow-[0_1px_3px_rgba(0,0,0,0.1)]" : "text-muted"}`}>
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex gap-1 rounded-[8px] bg-[#f1f1ef] p-1">
        {tab("qr", "QR 코드")}
        {tab("barcode", "바코드")}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_150px]">
        <div>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={mode === "qr" ? 500 : 40}
            placeholder={mode === "qr" ? "주소나 문구 (예: https://terrywell.kr)" : "숫자·영문 (예: 8801234567890)"}
            aria-label={mode === "qr" ? "QR 코드 내용" : "바코드 내용"}
            className="h-11 w-full rounded-[8px] border border-line px-3 text-[14px] outline-none focus:border-ink/50"
          />
          <div className="mt-2 flex items-center gap-1.5">
            <span className="mr-1 text-[12px] text-muted">색</span>
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} aria-label={c} aria-pressed={color === c} className={`size-7 rounded-full border-2 ${color === c ? "border-ink/60" : "border-transparent"}`} style={{ background: c }} />
            ))}
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            {mode === "qr" ? "라벨에서 1.5cm 이상 크기로 두면 휴대폰으로 잘 읽힙니다. 밝은 배경 위에 두세요." : "영문 대문자·숫자·기호로 만드는 CODE128 바코드입니다. 숫자 13자리는 EAN-13 으로 만듭니다."}
          </p>
          {shownErr && <p role="alert" className="mt-1 text-[12px] text-alert">{shownErr}</p>}
        </div>
        <div className="grid aspect-square place-items-center rounded-[8px] border border-line bg-white p-3">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(shown)}`} alt="미리보기" className="max-h-full max-w-full" />
          ) : (
            <span className="text-[12px] text-muted">미리보기</span>
          )}
        </div>
      </div>
      <button type="button" disabled={!shown} onClick={() => shown && ed.addSvgString(shown, mode === "qr" ? 0.55 : 0.5)} className="mt-3 h-11 w-full rounded-[8px] bg-ink text-[14.5px] text-white disabled:opacity-40">
        라벨에 넣기
      </button>
    </div>
  );
}

async function makeQr(text: string, color: string) {
  const QR = (await import("qrcode")).default;
  return QR.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: color, light: "#ffffff00" } });
}

async function makeBarcode(text: string, color: string) {
  const JsBarcode = (await import("jsbarcode")).default;
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const format = /^\d{13}$/.test(text) ? "EAN13" : "CODE128";
  let ok = true;
  JsBarcode(el, text, { format, lineColor: color, background: "transparent", displayValue: true, fontSize: 18, margin: 4, valid: (v: boolean) => (ok = v) });
  if (!ok) throw new Error("바코드로 만들 수 없는 내용입니다.");
  el.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(el);
}
