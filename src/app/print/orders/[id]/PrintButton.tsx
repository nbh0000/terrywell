"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex h-10 items-center gap-1.5 rounded-[6px] bg-ink px-4 text-[14px] text-white hover:bg-ink/85">
      <Printer size={16} /> 인쇄 · PDF 저장
    </button>
  );
}
