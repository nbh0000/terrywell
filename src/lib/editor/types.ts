// 에디터에서 서버·클라이언트가 같이 쓰는 타입과 계산.
// 좌표 단위: 캔버스 내부 1 단위 = 1/K mm (K=10). 라벨 크기를 바꿔도 mm 기준으로 계산된다.

export const K = 10; // 1mm 당 캔버스 단위
export const PRINT_DPI = 300;

export interface LabelSpec {
  widthMm: number; // 재단 가로
  heightMm: number; // 재단 세로
  bleedMm: number; // 도련 (작업 사이즈 = 재단 + 도련*2)
  safeMm: number; // 재단선 안쪽 안전 여백
  cornerMm: number; // 모서리 라운드
  pages: number; // 기본 페이지 수
  allowPages: boolean;
}

export interface MockupSpec {
  url: string | null;
  x: number; // 라벨 중심 (목업 대비 %)
  y: number;
  w: number; // 라벨 가로(재단) 길이 (목업 폭 대비 %)
  rotate: number;
}

/** 저장 형식. pages 는 Fabric canvas.toObject() 결과 */
export interface DesignDoc {
  v: 1;
  unit: "mm";
  k: number;
  label: LabelSpec;
  pages: unknown[];
}

export function workSize(l: LabelSpec) {
  return { w: l.widthMm + l.bleedMm * 2, h: l.heightMm + l.bleedMm * 2 };
}

/** 작업 사이즈 기준 300dpi 픽셀 */
export function printPixels(l: LabelSpec) {
  const { w, h } = workSize(l);
  return { w: Math.round((w / 25.4) * PRINT_DPI), h: Math.round((h / 25.4) * PRINT_DPI) };
}

export const fmtMm = (n: number) => (Math.round(n * 10) / 10).toString();
