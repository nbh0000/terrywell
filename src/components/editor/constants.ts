// 에디터 고정값

// 레퍼런스(03) 배경 패널의 기본 색상 팔레트를 원본에서 추출
export const PALETTE = [
  "#221817", "#717171", "#b5b5b5", "#e7e7e5", "#ffffff", "#c5346d", "#ce6b99", "#e0a8c1", "#e8bdc6", "#f3dade",
  "#de9da3", "#d2707d", "#c72e28", "#cf5c30", "#dd9376", "#e3a55c", "#d88632", "#e5b54f", "#ebc294", "#f3e3c2",
  "#f9f6c9", "#f5ef91", "#f4ea57", "#eeeca2", "#ebeacb", "#d5db95", "#d9db5e", "#bfcb4f", "#95ba46", "#b5cd8f",
  "#d3dfb9", "#a6cca7", "#52a249", "#368140", "#457f71", "#55a29c", "#65b3c7", "#539dce", "#a7cfe9", "#d6e4f1",
  "#a6c8e4", "#568bbf", "#3167a7", "#1c2c77", "#7182b6", "#a9b6d8", "#bebeda", "#9694bc", "#512479", "#7d1d77",
  "#a5294e", "#c19396", "#d6bfb1", "#957358", "#7e572c",
];

// 글꼴: 화면 이름 / CSS family. Google Fonts 는 app/editor/layout.tsx 에서 불러온다
export const FONTS = [
  { label: "프리텐다드", family: "Pretendard Variable" },
  { label: "본고딕", family: "Noto Sans KR" },
  { label: "본명조", family: "Noto Serif KR" },
  { label: "고운돋움", family: "Gowun Dodum" },
  { label: "도현", family: "Do Hyeon" },
  { label: "검은고딕", family: "Black Han Sans" },
  { label: "나눔손글씨 펜", family: "Nanum Pen Script" },
  { label: "개구", family: "Gaegu" },
  { label: "Poppins", family: "Poppins" },
  { label: "Playfair", family: "Playfair Display" },
];

// 가이드 선 색 (레퍼런스와 같은 색)
export const GUIDE = { trim: "#d1347a", work: "#7b3f98", safe: "#f2d23a" };

export const PT_TO_MM = 0.3528;

export type ToolKey = "size" | "page" | "photo" | "frame" | "text" | "design" | "ai" | "sticker" | "background";
