import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "이용가이드" };

// 헤더 "이용가이드": 주문 순서와 디자인 방식 안내
const STEPS = [
  { title: "제품 선택", body: "제품 소개에서 수건을 고르고 색상을 선택합니다." },
  { title: "디자인", body: "에디터로 라벨을 직접 디자인하거나, 완성된 PDF·AI·EPS 파일을 올립니다." },
  { title: "저장", body: "에디터에서 [편집종료] → [저장하기]를 누르면 마이페이지에 디자인이 보관됩니다." },
  { title: "주문 · 결제", body: "수량을 정하고 장바구니에 담아 결제합니다. 수량이 많을수록 단가가 낮아집니다(단가표 참고)." },
  { title: "제작 · 배송", body: "결제 후 제작이 시작되며 진행 상태와 송장번호는 마이페이지 주문 내역에서 확인할 수 있습니다." },
];

const EDITOR = [
  ["재단선", "실제 제작되는 라벨 크기입니다."],
  ["작업 사이즈", "배경이 있는 디자인은 이 선까지 채워 주세요."],
  ["안전 영역", "중요한 글자와 이미지는 이 선 안쪽에 넣어 주세요."],
  ["AI 생성", "만들고 싶은 그림을 글로 적으면 라벨 비율에 맞는 이미지를 만들어 줍니다. 회원은 하루 무료 횟수 안에서 쓸 수 있습니다."],
];

export default function GuidePage() {
  return (
    <section className="mx-auto w-full max-w-[960px] px-5 pb-24 pt-12 md:px-10 md:pt-16">
      <h1 className="font-display text-[22px] font-medium">Guide</h1>
      <p className="text-[14px] text-muted">이용가이드</p>

      <h2 className="mt-12 border-b border-ink/70 pb-3 text-[17px] font-semibold">주문 순서</h2>
      <ol className="mt-2">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-5 border-b border-line py-5">
            <span className="font-display text-[22px] font-medium text-point">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="font-medium">{s.title}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-ink/80">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-14 border-b border-ink/70 pb-3 text-[17px] font-semibold">라벨 에디터</h2>
      <dl className="mt-2">
        {EDITOR.map(([k, v]) => (
          <div key={k} className="flex gap-6 border-b border-line py-4 text-[14px]">
            <dt className="w-24 shrink-0 font-medium">{k}</dt>
            <dd className="leading-relaxed text-ink/80">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 flex flex-wrap gap-2">
        <Link href="/products" className="flex h-12 items-center bg-ink px-7 text-[15px] text-white">라벨 디자인 시작하기</Link>
        <Link href="/quote" className="flex h-12 items-center border border-ink px-7 text-[15px]">견적문의</Link>
      </div>
    </section>
  );
}
