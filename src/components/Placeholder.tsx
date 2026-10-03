// 이미지가 없을 때 같은 비율로 자리만 잡아 두는 상자. src 가 있으면 이미지를 그린다.
export function ImageBox({
  src,
  alt,
  ratio,
  className = "",
  label,
  tone = "light",
}: {
  src: string | null | undefined;
  alt: string;
  ratio?: string; // 예: "3 / 4"
  className?: string;
  label?: string;
  /** placeholder 바탕. 위에 흰 글자가 올라가면 mid */
  tone?: "light" | "mid";
}) {
  return (
    <div className={`relative overflow-hidden ${tone === "mid" ? "bg-[#cbc6bd]" : "bg-cloud"} ${className}`} style={ratio ? { aspectRatio: ratio } : undefined}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="absolute bottom-3 right-4 text-[10px] tracking-widest text-ink/30" aria-label={alt}>
          {label ?? "IMAGE"}
        </span>
      )}
    </div>
  );
}
