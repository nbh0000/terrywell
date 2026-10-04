"use client";

import { useRef, useState } from "react";
import { Upload as UploadIcon } from "lucide-react";
import { adminUploadAction } from "./actions";

/** 파일을 올리고 URL 을 돌려준다 */
export function UploadButton({
  onUploaded,
  bucket = "product-images",
  accept = "image/*",
  label = "파일 올리기",
  className = "",
}: {
  onUploaded: (url: string, name: string) => void;
  bucket?: "product-images" | "mockups" | "templates";
  accept?: string;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className={`inline-flex flex-col ${className}`}>
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          setErr(null);
          const fd = new FormData();
          fd.set("file", f);
          fd.set("bucket", bucket);
          const r = await adminUploadAction(fd);
          setBusy(false);
          e.target.value = "";
          if (r.ok) onUploaded(r.url, r.name);
          else setErr(r.error);
        }}
      />
      <button type="button" disabled={busy} onClick={() => ref.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-line bg-white px-3 text-[13px] hover:border-ink/40 disabled:opacity-50">
        <UploadIcon size={14} /> {busy ? "올리는 중…" : label}
      </button>
      {err && <span className="mt-1 text-[12px] text-alert">{err}</span>}
    </span>
  );
}
