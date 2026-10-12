"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { btnCls, inputCls } from "../ui";
import { UploadButton } from "../Upload";
import { saveSiteAction } from "../site/actions";

type Font = { label: string; family: string; url: string };

// 글꼴 파일(WOFF2·WOFF·TTF·OTF)을 올리고 에디터에 보일 이름을 정한다.
// 상업적으로 쓸 수 있는 글꼴만 올린다 (라벨은 판매 상품에 인쇄된다)
export function FontsForm({ initial }: { initial: Font[] }) {
  const [fonts, setFonts] = useState<Font[]>(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const upd = (i: number, v: Partial<Font>) => setFonts((xs) => xs.map((x, j) => (j === i ? { ...x, ...v } : x)));

  return (
    <div>
      <p className="mb-4 text-[13px] leading-relaxed text-muted">
        글꼴 파일을 올리고 이름을 정해 저장하면 에디터의 글꼴 목록에 바로 나옵니다. 라벨은 판매 상품에 인쇄되므로 <b className="font-medium text-ink">상업적 사용이 허락된 글꼴</b>만 올려 주세요 (예: 눈누 noonnu.cc 에서 &apos;상업용 무료&apos; 확인).
      </p>
      {fonts.length > 0 && (
        <ul className="mb-4 space-y-2">
          {fonts.map((f, i) => (
            <li key={i} className="flex flex-wrap items-center gap-3 rounded-[8px] border border-line p-3">
              <input className={`${inputCls} w-48!`} value={f.label} placeholder="에디터에 보일 이름" aria-label="글꼴 이름" onChange={(e) => upd(i, { label: e.target.value, family: `TW ${e.target.value.trim()}` })} />
              <span className="min-w-0 flex-1 truncate text-[13px] text-muted">{f.url ? f.url.split("/").pop() : "파일 없음"}</span>
              {f.url && f.label && (
                <span className="text-[18px]" style={{ fontFamily: `"${f.family}"` }}>
                  <style>{`@font-face{font-family:"${f.family.replace(/"/g, "")}";src:url("${f.url}")}`}</style>
                  가나다 ABC 123
                </span>
              )}
              <UploadButton bucket="templates" accept=".woff2,.woff,.ttf,.otf" label={f.url ? "파일 바꾸기" : "파일 올리기"} onUploaded={(url) => upd(i, { url })} />
              <button type="button" onClick={() => setFonts((xs) => xs.filter((_, j) => j !== i))} aria-label="글꼴 삭제" className="text-muted"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-3">
        <button type="button" className="text-[13px] underline" onClick={() => setFonts((xs) => [...xs, { label: "", family: "", url: "" }])}>글꼴 추가</button>
        <button
          type="button"
          className={btnCls}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const clean = fonts.filter((f) => f.label.trim() && f.url).map((f) => ({ ...f, label: f.label.trim(), family: `TW ${f.label.trim()}` }));
              const r = await saveSiteAction("fonts", { custom: clean });
              setFonts(clean);
              setMsg(r.ok ? "저장했습니다. 에디터에 바로 나옵니다." : r.error ?? "저장하지 못했습니다.");
            })
          }
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        {msg && <span className="text-[13px] text-muted">{msg}</span>}
      </div>
    </div>
  );
}
