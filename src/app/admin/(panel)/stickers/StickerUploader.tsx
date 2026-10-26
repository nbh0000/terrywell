"use client";

import { useState } from "react";
import { UploadButton } from "../Upload";

export function StickerUploader({ onAdd }: { onAdd: (url: string, name: string, category: string) => Promise<void> }) {
  const [category, setCategory] = useState("아이콘");
  return (
    <div className="flex items-center gap-2">
      <input value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-28 rounded-[6px] border border-line bg-white px-2 text-[13px]" aria-label="분류" placeholder="분류" />
      <UploadButton bucket="templates" accept=".svg,image/svg+xml,image/png" label="스티커 올리기" onUploaded={(url, name) => onAdd(url, name.replace(/\.[^.]+$/, ""), category)} />
    </div>
  );
}
