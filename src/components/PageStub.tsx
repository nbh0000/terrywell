// 다음 단계에서 채울 페이지의 자리. 제목만 표시한다.
export function PageStub({ title, step }: { title: string; step: string }) {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-20 md:px-8">
      <h1 className="text-2xl font-medium tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-muted">작업 순서 {step}단계에서 만듭니다.</p>
    </section>
  );
}
