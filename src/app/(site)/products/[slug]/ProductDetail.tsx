"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ChevronDown, Frame, Heart, Minus, Plus } from "lucide-react";
import { MixNotice } from "@/components/shop/MixNotice";
import { normalizeQty, splitVat, unitPriceFor, won, type Tier } from "@/lib/pricing";
import type { ImageRef, LabeledValue } from "@/lib/db/types";
import { addToCartAction, toggleWishlistAction } from "./actions";

interface Props {
  product: {
    id: string;
    slug: string;
    nameEn: string;
    nameKo: string;
    images: ImageRef[];
    specs: LabeledValue[];
    specNote: string;
    towelSize: string;
    labelW: number;
    labelH: number;
    shipping: LabeledValue[];
    basePrice: number;
    vatIncluded: boolean;
    allowEditor: boolean;
    allowUpload: boolean;
    detailHtml: string;
    detailImages: ImageRef[];
    noticeHtml: string;
    guideHtml: string;
    qtyStep: number;
  };
  colors: { id: string; name: string; swatch: string; images: ImageRef[]; isMix: boolean }[];
  initialColorId: string | null;
  tiers: Tier[];
  mixNotice: string[];
  loggedIn: boolean;
  wished: boolean;
  design: { id: string; thumbnail: string | null; colorId: string | null } | null;
}

export function ProductDetail(p: Props) {
  const { product, colors } = p;
  const router = useRouter();
  const [colorId, setColorId] = useState(p.initialColorId);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const design = p.design;
  const step = Math.max(1, product.qtyStep || 1);
  const [qty, setQty] = useState(step);
  const [qtyText, setQtyText] = useState(String(step));
  const [wished, setWished] = useState(p.wished);
  const [shipOpen, setShipOpen] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const color = colors.find((c) => c.id === colorId) ?? colors[0];
  const main = mainImage ?? color?.images[0]?.url ?? product.images[0]?.url ?? null;
  const unit = unitPriceFor(qty, p.tiers, product.basePrice);
  const { supply, vat, total } = splitVat(unit * qty, product.vatIncluded);
  const ready = !!design;
  const loginUrl = `/login?next=${encodeURIComponent(`/products/${product.slug}`)}`;
  const editorUrl = (designId?: string) => `/editor/${product.slug}?${new URLSearchParams({ ...(colorId ? { color: colorId } : {}), ...(designId ? { design: designId } : {}) })}`;

  function changeQty(next: number) {
    const q = normalizeQty(next, step);
    setQty(q);
    setQtyText(String(q));
  }

  function addToCart(buyNow: boolean) {
    if (!p.loggedIn) return router.push(loginUrl);
    setMsg(null);
    start(async () => {
      const r = await addToCartAction({
        productId: product.id,
        colorId,
        designId: design?.id ?? null,
        uploadId: null,
        quantity: qty,
      });
      if (!r.ok) {
        if (r.needLogin) return router.push(loginUrl);
        return setMsg(r.error ?? "장바구니에 담지 못했습니다.");
      }
      router.push(buyNow ? `/checkout?items=${r.cartItemId}` : "/cart");
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-5 pb-24 pt-8 md:px-10 md:pt-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
        {/* 왼쪽: 메인 이미지 + 색상별 썸네일 */}
        <section>
          <div className="grid aspect-[4/5] place-items-center bg-tile p-6 md:p-10">
            {main && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={main} alt={`${product.nameKo} ${color?.name ?? ""}`} className="max-h-full max-w-full object-contain mix-blend-multiply" />
            )}
          </div>
          <ul className="mt-4 grid grid-cols-3 gap-3 md:gap-4">
            {colors.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setColorId(c.id);
                    setMainImage(null);
                  }}
                  className={`block w-full bg-tile p-2 transition-shadow ${c.id === colorId && !mainImage ? "ring-1 ring-ink/40" : ""}`}
                  aria-label={`${c.name} 보기`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.images[1]?.url ?? c.images[0]?.url ?? undefined} alt="" className="aspect-square w-full object-contain mix-blend-multiply" />
                </button>
              </li>
            ))}
            {product.images[1]?.url && !colors.some((c) => c.isMix) && (
              <li>
                <button type="button" onClick={() => setMainImage(product.images[1].url)} className={`block w-full bg-tile p-2 ${mainImage === product.images[1].url ? "ring-1 ring-ink/40" : ""}`} aria-label="전체 색상 보기">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.images[1].url} alt="" className="aspect-square w-full object-contain mix-blend-multiply" />
                </button>
              </li>
            )}
          </ul>
        </section>

        {/* 오른쪽: 정보 */}
        <section>
          <h1 className="font-display text-[1.7rem] font-medium leading-tight md:text-[2rem]">{product.nameEn}</h1>
          <p className="text-[1.25rem] md:text-[1.45rem]">{product.nameKo}</p>

          <dl className="mt-8 space-y-3 text-[14.5px]">
            {product.specs.map((s) => (
              <div key={s.label} className="flex gap-5">
                <dt className="w-14 shrink-0 font-semibold">{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
          {product.specNote && <p className="mt-5 text-[14px]">{product.specNote}</p>}

          {/* 색상 스와치: 시안처럼 사선 스트라이프 */}
          {colors.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-4">
              {colors.map((c) => (
                <button key={c.id} type="button" onClick={() => { setColorId(c.id); setMainImage(null); }} className="group flex flex-col items-center gap-1.5" aria-pressed={c.id === colorId}>
                  <span
                    className={`block h-8 w-[58px] ${c.id === colorId ? "outline outline-2 outline-offset-2 outline-ink" : ""}`}
                    style={{ background: c.isMix ? c.swatch : `repeating-linear-gradient(45deg, ${c.swatch} 0 7px, #fbf8ec 7px 14px)` }}
                  />
                  <span className={`font-[Georgia,serif] text-[15px] ${c.id === colorId ? "text-ink" : "text-ink/70"}`}>{c.name}</span>
                </button>
              ))}
            </div>
          )}
          {color?.isMix && <MixNotice lines={p.mixNotice} className="mt-4" />}

          <SizeDiagram towelSize={product.towelSize} labelW={product.labelW} labelH={product.labelH} />

          {/* 레퍼런스(키링 상품 페이지) 구성 */}
          <div className="mt-8 border-t border-line pt-6">
            <button type="button" onClick={() => setShipOpen((v) => !v)} className="flex w-full items-center justify-between text-[17px] font-semibold" aria-expanded={shipOpen}>
              배송 안내 <ChevronDown size={18} className={`transition-transform ${shipOpen ? "rotate-180" : ""}`} />
            </button>
            {shipOpen && (
              <dl className="mt-4 space-y-2 text-[13.5px] text-ink/80">
                {product.shipping.map((s) => (
                  <div key={s.label} className="flex gap-6">
                    <dt className="w-16 shrink-0 text-muted">{s.label}</dt>
                    <dd className="whitespace-pre-line">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* 디자인 (2026-10: PDF 업로드 대신 에디터에서 파일을 불러온다) */}
          <div className="mt-6 border-t border-line pt-6">
            <h2 className="text-[17px] font-semibold">디자인</h2>
            {design ? (
              <div className="mt-3 flex items-center gap-4 rounded-[10px] bg-tile p-4">
                <div className="w-28 shrink-0 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {design.thumbnail && <img src={design.thumbnail} alt="저장한 라벨 디자인" className="w-full" />}
                </div>
                <div className="text-[13.5px]">
                  <p className="font-medium">저장한 디자인</p>
                  <div className="mt-2 flex gap-2">
                    <Link href={editorUrl(design.id)} className="rounded-[8px] border border-line bg-white px-3 py-1.5">디자인 수정</Link>
                    <Link href={editorUrl()} className="rounded-[8px] px-2 py-1.5 text-muted underline">새로 만들기</Link>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                [디자인하기]를 누르면 라벨 에디터가 열립니다. 에디터에서 이미지·PDF 파일을 불러오거나 카메라로 찍어 넣을 수 있습니다.
              </p>
            )}
          </div>

          {/* 상품가격 */}
          <div className="mt-6 border-t border-line pt-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[17px] font-semibold">상품가격</h2>
              {step > 1 && <p className="text-[12.5px] text-muted">{step}개 단위로 주문할 수 있습니다</p>}
            </div>
            <div className="mt-3 rounded-[10px] bg-tile p-4">
              <p className="text-[13.5px]">{product.nameKo}{color ? ` · ${color.name}` : ""}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex h-11 items-center rounded-[6px] border border-line bg-white">
                  <button type="button" className="grid h-full w-10 place-items-center text-muted disabled:opacity-40" disabled={qty <= step} onClick={() => changeQty(qty - step)} aria-label="수량 줄이기"><Minus size={16} /></button>
                  <input
                    value={qtyText}
                    onChange={(e) => setQtyText(e.target.value.replace(/\D/g, ""))}
                    onBlur={() => changeQty(Number(qtyText) || step)}
                    onKeyDown={(e) => e.key === "Enter" && changeQty(Number(qtyText) || step)}
                    inputMode="numeric"
                    className="h-full w-14 text-center text-[15px] outline-none"
                    aria-label={step > 1 ? `수량 (${step}개 단위)` : "수량"}
                  />
                  <button type="button" className="grid h-full w-10 place-items-center" onClick={() => changeQty(qty + step)} aria-label="수량 늘리기"><Plus size={16} /></button>
                </div>
                <div className="text-right">
                  <p className="text-[17px] font-semibold">{won(unit * qty)}</p>
                  <p className="text-[12px] text-muted">개별 단가 {won(unit)}</p>
                </div>
              </div>
            </div>
            <dl className="mt-4 space-y-1.5 text-[14.5px]">
              <div className="flex justify-between"><dt>공급가액</dt><dd className="font-medium">{won(supply)}</dd></div>
              <div className="flex justify-between"><dt>부가가치세</dt><dd className="font-medium">{won(vat)}</dd></div>
            </dl>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
              <span className="text-[18px] font-semibold">총 합계금액</span>
              <span className="text-[26px] font-semibold text-point">{won(total)}</span>
            </div>
            {msg && <p role="alert" className="mt-3 text-[13px] text-alert">{msg}</p>}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  start(async () => {
                    const r = await toggleWishlistAction(product.id);
                    if (r.needLogin) return router.push(loginUrl);
                    if (r.ok) setWished(!!r.wished);
                  })
                }
                className="grid size-14 shrink-0 place-items-center rounded-full border border-line bg-white"
                aria-label={wished ? "찜 해제" : "찜하기"}
                aria-pressed={wished}
              >
                <Heart size={22} className={wished ? "fill-alert text-alert" : "fill-[#d5d5d8] text-[#d5d5d8]"} />
              </button>
              {ready ? (
                <>
                  <button type="button" disabled={pending} onClick={() => addToCart(false)} className="h-14 flex-1 rounded-[10px] border border-point bg-white text-[16px] font-medium text-point disabled:opacity-50">
                    장바구니 담기
                  </button>
                  <button type="button" disabled={pending} onClick={() => addToCart(true)} className="h-14 flex-1 rounded-[10px] bg-point text-[16px] font-medium text-white hover:bg-point-dark disabled:opacity-50">
                    바로 구매
                  </button>
                </>
              ) : (
                <Link href={editorUrl()} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[10px] bg-point text-[16px] font-medium text-white hover:bg-point-dark">
                  <Frame size={19} /> 디자인하기
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>

      <DetailTabs product={product} />

    </div>
  );
}

/** 시안의 사이즈 도식: 수건 전체 + 라벨 위치 확대 */
function SizeDiagram({ towelSize, labelW, labelH }: { towelSize: string; labelW: number; labelH: number }) {
  const nums = (towelSize.match(/[\d.]+/g) ?? ["40", "80"]).map(Number);
  const long = Math.max(...nums);
  const short = Math.min(...nums);
  const lw = (labelW / 10).toString();
  const lh = (labelH / 10).toString();
  const stroke = { stroke: "#9b9b9b", strokeWidth: 1, fill: "none" };
  return (
    <div className="mt-6 border-t border-line pt-6">
      <svg viewBox="0 0 700 200" className="w-full" role="img" aria-label={`수건 ${short}×${long}cm, 라벨 ${lh}×${lw}cm`}>
        <rect x="10" y="10" width="280" height="140" {...stroke} />
        <line x1="16" y1="10" x2="16" y2="150" {...stroke} />
        <line x1="284" y1="10" x2="284" y2="150" {...stroke} />
        {/* 라벨: 가로로 눕힌 수건의 오른쪽 위 (세워 걸면 오른쪽 아래) */}
        <rect x="262" y="22" width="13" height="20" {...stroke} />
        <line x1="310" y1="10" x2="310" y2="150" {...stroke} />
        <text x="318" y="84" fontSize="13" fill="#555">{short}cm</text>
        <line x1="10" y1="175" x2="120" y2="175" {...stroke} />
        <line x1="180" y1="175" x2="290" y2="175" {...stroke} />
        <text x="150" y="179" fontSize="12" fill="#555" textAnchor="middle">{long}cm</text>

        <rect x="400" y="10" width="270" height="130" {...stroke} />
        <line x1="400" y1="133" x2="670" y2="133" {...stroke} />
        <rect x="602" y="72" width="48" height="34" {...stroke} />
        <text x="626" y="62" fontSize="13" fill="#555" textAnchor="middle">{lw}</text>
        <line x1="594" y1="72" x2="594" y2="106" {...stroke} />
        <text x="586" y="94" fontSize="13" fill="#555" textAnchor="end">{lh}</text>
        <text x="676" y="139" fontSize="12" fill="#555">(cm)</text>
        <line x1="400" y1="175" x2="505" y2="175" {...stroke} />
        <line x1="565" y1="175" x2="670" y2="175" {...stroke} />
        <text x="535" y="179" fontSize="12" fill="#555" textAnchor="middle">{short}cm</text>
      </svg>
    </div>
  );
}

function DetailTabs({ product }: { product: Props["product"] }) {
  const tabs = [
    { id: "info", label: "상품정보" },
    { id: "notice", label: "유의사항" },
    { id: "guide", label: "이용안내" },
  ];
  return (
    <div className="mt-20">
      <nav className="sticky top-14 z-20 flex border-b border-line bg-page/95 backdrop-blur lg:top-[78px]">
        {tabs.map((t) => (
          <a key={t.id} href={`#${t.id}`} className="flex-1 py-4 text-center text-[15px] text-ink/80 hover:text-ink">{t.label}</a>
        ))}
      </nav>
      <section id="info" className="scroll-mt-36 pt-10">
        {product.detailHtml && <div className="prose-tw mx-auto max-w-[860px]" dangerouslySetInnerHTML={{ __html: product.detailHtml }} />}
        <div className="mx-auto flex max-w-[860px] flex-col">
          {product.detailImages.map((im, i) =>
            im.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={im.url} alt={im.alt} className="w-full" loading="lazy" />
            ) : null,
          )}
        </div>
      </section>
      <section id="notice" className="mx-auto max-w-[860px] scroll-mt-36 pt-16">
        <h2 className="text-[18px] font-semibold">유의사항</h2>
        <div className="prose-tw mt-4" dangerouslySetInnerHTML={{ __html: product.noticeHtml || "<p>-</p>" }} />
      </section>
      <section id="guide" className="mx-auto max-w-[860px] scroll-mt-36 pt-16">
        <h2 className="text-[18px] font-semibold">이용안내</h2>
        <div className="prose-tw mt-4" dangerouslySetInnerHTML={{ __html: product.guideHtml || "<p>-</p>" }} />
      </section>
    </div>
  );
}
