import type { ReactNode } from "react";

// 에디터 글꼴 (components/editor/constants.ts 의 FONTS 와 맞춘다)
const FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Do+Hyeon&family=Gaegu:wght@400;700&family=Gowun+Dodum&family=Nanum+Pen+Script&family=Noto+Sans+KR:wght@400;700&family=Noto+Serif+KR:wght@400;700&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;600&display=swap";

export default function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href={FONT_CSS} />
      {children}
    </>
  );
}
