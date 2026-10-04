"use client";

import "@/components/editor/fabric-setup";
import { useEffect, useState } from "react";
import { renderPage } from "@/components/editor/fabric-setup";
import type { DesignDoc } from "@/lib/editor/types";

export function TemplateThumb({ doc }: { doc: unknown }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const d = doc as DesignDoc;
    let alive = true;
    renderPage(d.pages[0], d.label, { width: 420, area: "trim" }).then((u) => alive && setUrl(u)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [doc]);
  const d = doc as DesignDoc;
  return (
    <div className="grid place-items-center bg-cloud" style={{ aspectRatio: `${d.label.widthMm} / ${d.label.heightMm}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt="" className="h-full w-full object-contain" />}
    </div>
  );
}
