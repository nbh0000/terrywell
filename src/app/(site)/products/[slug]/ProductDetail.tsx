"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { BookOpen, ChevronDown, CloudUpload, FileDown, FileText, FolderOpen, Frame, Heart, Minus, Plus, Table2, X } from "lucide-react";
import { splitVat, unitPriceFor, won, type Tier } from "@/lib/pricing";
import type { ImageRef, LabeledValue } from "@/lib/db/types";
import { addToCartAction, deleteDesignFileAction, toggleWishlistAction, uploadDesignFileAction } from "./actions";

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
  };
  colors: { id: string; name: string; swatch: string; images: ImageRef[] }[];
  initialColorId: string | null;
  tiers: Tier[];
  files: { guide: string | null; template: string | null };
  consent: string[];
  loggedIn: boolean;
  wished: boolean;
  design: { id: string; thumbnail: string | null; colorId: string | null } | null;
}

type Mode = "editor" | "upload";

export function ProductDetail(p: Props) {
  const { product, colors } = p;
  const router = useRouter();
  const [colorId, setColorId] = useState(p.initialColorId);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(product.allowEditor ? "editor" : "upload");
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  const [design, setDesign] = useState(p.design);
  const [upload, setUpload] = useState<{ id: string; fileName: string; fileSize: number } | null>(null);
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(p.wished);
  const [showTiers, setShowTiers] = useState(false);
  const [shipOpen, setShipOpen] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const color = colors.find((c) => c.id === colorId) ?? colors[0];
  const main = mainImage ?? color?.images[0]?.url ?? product.images[0]?.url ?? null;
  const unit = unitPriceFor(qty, p.tiers, product.basePrice);
  const { supply, vat, total } = splitVat(unit * qty, product.vatIncluded);
  const ready = mode === "editor" ? !!design : !!upload;
  const loginUrl = `/login?next=${encodeURIComponent(`/products/${product.slug}`)}`;
  const editorUrl = (designId?: string) => `/editor/${product.slug}?${new URLSearchParams({ ...(colorId ? { color: colorId } : {}), ...(designId ? { design: designId } : {}) })}`;

  function changeMode(m: Mode) {
    if (m === mode) return;
    if ((mode === "editor" && design) || (mode === "upload" && upload)) setPendingMode(m);
    else setMode(m);
  }
  function confirmMode() {
    if (!pendingMode) return;
    if (mode === "editor") setDesign(null);
    else if (upload) {
      void deleteDesignFileAction(upload.id);
      setUpload(null);
    }
    setMode(pendingMode);
    setPendingMode(null);
  }

  function addToCart(buyNow: boolean) {
    if (!p.loggedIn) return router.push(loginUrl);
    setMsg(null);
    start(async () => {
      const r = await addToCartAction({
        productId: product.id,
        colorId,
        designId: mode === "editor" ? design?.id ?? null : null,
        uploadId: mode === "upload" ? upload?.id ?? null : null,
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
          <div className="grid aspect-[4/5] place-items-center bg-paper p-6 md:p-10">
            {main && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={main} alt={`${product.nameKo} ${color?.name ?? ""}`} className="max-h-full max-w-full object-contain" />
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
                  className={`block w-full bg-paper p-2 transition-shadow ${c.id === colorId && !mainImage ? "ring-1 ring-ink/40" : ""}`}
                  aria-label={`${c.name} 보기`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.images[1]?.url ?? c.images[0]?.url ?? undefined} alt="" className="aspect-square w-full object-contain" />
                </button>
              </li>
            ))}
            {product.images[1]?.url && (
              <li>
                <button type="button" onClick={() => setMainImage(product.images[1].url)} className={`block w-full bg-paper p-2 ${mainImage === product.images[1].url ? "ring-1 ring-ink/40" : ""}`} aria-label="전체 색상 보기">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.images[1].url} alt="" className="aspect-square w-full object-contain" />
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
                    style={{ background: `repeating-linear-gradient(45deg, ${c.swatch} 0 7px, #fbf8ec 7px 14px)` }}
                  />
                  <span className={`font-[Georgia,serif] text-[15px] ${c.id === colorId ? "text-ink" : "text-ink/70"}`}>{c.name}</span>
                </button>
              ))}
            </div>
          )}

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

          {/* 디자인 방식 */}
          <div className="mt-6 border-t border-line pt-6">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h2 className="text-[17px] font-semibold">디자인</h2>
              <p className="text-[13px] text-muted">디자인 방식을 변경하면 기존 디자인은 초기화됩니다.</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {product.allowEditor && (
                <ModeButton active={mode === "editor"} onClick={() => changeMode("editor")} Icon={Frame}>에디터로 편집</ModeButton>
              )}
              {product.allowUpload && (
                <ModeButton active={mode === "upload"} onClick={() => changeMode("upload")} Icon={CloudUpload}>PDF 업로드</ModeButton>
              )}
            </div>

            {mode === "editor" ? (
              <div className="mt-4">
                {design ? (
                  <div className="flex items-center gap-4 rounded-[10px] bg-[#f3f3f5] p-4">
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
                  <p className="text-[13.5px] text-muted">[디자인하기]를 누르면 라벨 에디터가 열립니다. 저장한 디자인은 여기에 표시됩니다.</p>
                )}
              </div>
            ) : (
              <UploadBox productId={product.id} files={p.files} consent={p.consent} loggedIn={p.loggedIn} loginUrl={loginUrl} upload={upload} setUpload={setUpload} />
            )}
          </div>

          {/* 상품가격 */}
          <div className="mt-6 border-t border-line pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-semibold">상품가격</h2>
              <button type="button" onClick={() => setShowTiers(true)} className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px]">
                <Table2 size={15} /> 단가표
              </button>
            </div>
            <div className="mt-3 rounded-[10px] bg-[#f3f3f5] p-4">
              <p className="text-[13.5px]">{product.nameKo}{color ? ` · ${color.name}` : ""}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex h-11 items-center rounded-[6px] border border-line bg-white">
                  <button type="button" className="grid h-full w-10 place-items-center text-muted" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="수량 줄이기"><Minus size={16} /></button>
                  <input
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Math.min(100000, Number(e.target.value.replace(/\D/g, "")) || 1)))}
                    inputMode="numeric"
                    className="h-full w-14 text-center text-[15px] outline-none"
                    aria-label="수량"
                  />
                  <button type="button" className="grid h-full w-10 place-items-center" onClick={() => setQty((q) => Math.min(100000, q + 1))} aria-label="수량 늘리기"><Plus size={16} /></button>
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
              ) : mode === "editor" ? (
                <Link href={editorUrl()} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[10px] bg-point text-[16px] font-medium text-white hover:bg-point-dark">
                  <Frame size={19} /> 디자인하기
                </Link>
              ) : (
                <button type="button" disabled className="h-14 flex-1 rounded-[10px] bg-point text-[15px] text-white opacity-40">디자인 파일을 올려 주세요</button>
              )}
            </div>
          </div>
        </section>
      </div>

      <DetailTabs product={product} />

      {showTiers && (
        <Modal title="단가표" onClose={() => setShowTiers(false)}>
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-line text-left text-muted"><th className="py-2 font-normal">수량</th><th className="py-2 text-right font-normal">개당 단가</th></tr>
            </thead>
            <tbody>
              {(p.tiers.length ? p.tiers : [{ min_qty: 1, unit_price: product.basePrice }]).map((t, i, arr) => (
                <tr key={t.min_qty} className="border-b border-line/60">
                  <td className="py-2.5">{t.min_qty.toLocaleString()}개{arr[i + 1] ? ` ~ ${(arr[i + 1].min_qty - 1).toLocaleString()}개` : " 이상"}</td>
                  <td className="py-2.5 text-right">{won(t.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[12px] text-muted">{product.vatIncluded ? "부가세 포함 가격입니다." : "부가세 별도 가격입니다."}</p>
        </Modal>
      )}
      {pendingMode && (
        <Modal title="디자인 방식 변경" onClose={() => setPendingMode(null)}>
          <p className="text-[14px] text-muted">디자인 방식을 변경하면 기존 디자인은 초기화됩니다. 변경할까요?</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" className="h-11 rounded-[8px] border border-line" onClick={() => setPendingMode(null)}>취소</button>
            <button type="button" className="h-11 rounded-[8px] bg-ink text-white" onClick={confirmMode}>변경</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ModeButton({ active, onClick, Icon, children }: { active: boolean; onClick: () => void; Icon: typeof Frame; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-14 items-center gap-2.5 rounded-[10px] border px-4 text-[15.5px] font-medium ${active ? "border-2 border-ink bg-white text-point" : "border-[#e1e1e6] bg-[#f3f3f5] text-ink/70"}`}
    >
      <Icon size={20} /> {children}
    </button>
  );
}

function UploadBox({
  productId,
  files,
  consent,
  loggedIn,
  loginUrl,
  upload,
  setUpload,
}: {
  productId: string;
  files: { guide: string | null; template: string | null };
  consent: string[];
  loggedIn: boolean;
  loginUrl: string;
  upload: { id: string; fileName: string; fileSize: number } | null;
  setUpload: (u: { id: string; fileName: string; fileSize: number } | null) => void;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [a1, setA1] = useState(false);
  const [a2, setA2] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const agreed = a1 && a2;

  async function onFile(f: File | undefined) {
    if (!f) return;
    setErr(null);
    if (f.size > 50 * 1024 * 1024) return setErr("50MB 이하 파일만 올릴 수 있습니다.");
    setBusy(true);
    const fd = new FormData();
    fd.set("productId", productId);
    fd.set("file", f);
    fd.set("agree1", "on");
    fd.set("agree2", "on");
    const r = await uploadDesignFileAction(fd);
    setBusy(false);
    if (input.current) input.current.value = "";
    if (!r.ok) {
      if (r.needLogin) return router.push(loginUrl);
      return setErr(r.error);
    }
    setUpload(r.upload);
  }

  const agreeRow = (checked: boolean, set: (v: boolean) => void, children: React.ReactNode) => (
    <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-line bg-white p-3.5 text-[13.5px] leading-relaxed">
      <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} className="mt-0.5 size-[18px] shrink-0 accent-point" />
      <span>
        <span className="mr-1.5 rounded-[4px] bg-alert px-1.5 py-0.5 text-[11px] font-semibold text-white">필수</span>
        {children}
      </span>
    </label>
  );

  return (
    <div className="mt-4 space-y-3">
      <p className="flex items-center gap-1.5 text-[14px] font-medium"><FileText size={16} /> 파일 접수를 위해 아래 항목에 모두 동의해주세요</p>
      {agreeRow(a1, setA1, consent[0])}
      {agreeRow(a2, setA2, consent[1])}
      <div className="flex gap-2">
        <FileLink href={files.guide} Icon={BookOpen}>제작가이드</FileLink>
        <FileLink href={files.template} Icon={FileDown}>도안 파일</FileLink>
      </div>
      <div className="rounded-[10px] bg-[#f3f3f5] p-4">
        {upload ? (
          <div className="flex items-center gap-3 text-[14px]">
            <FileText size={20} className="shrink-0 text-point" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{upload.fileName}</p>
              <p className="text-[12px] text-muted">{(upload.fileSize / 1024 / 1024).toFixed(1)}MB</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await deleteDesignFileAction(upload.id);
                setUpload(null);
              }}
              className="rounded-[6px] border border-line bg-white p-1.5"
              aria-label="파일 삭제"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <input ref={input} type="file" accept=".pdf,.ai,.eps,application/pdf,application/postscript" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            <button
              type="button"
              disabled={!agreed || busy}
              onClick={() => (loggedIn ? input.current?.click() : router.push(loginUrl))}
              className="flex items-center gap-2 rounded-[8px] bg-point px-5 py-3 text-[14px] font-medium text-white disabled:opacity-40"
            >
              <FolderOpen size={17} /> {busy ? "올리는 중…" : "PDF 파일 선택"}
            </button>
            <p className="mt-2.5 text-[13px] text-muted">50MB 이하의 PDF, AI, EPS 파일만 올릴 수 있습니다.{!agreed && " 위 항목에 먼저 동의해 주세요."}</p>
          </>
        )}
        {err && <p role="alert" className="mt-2 text-[12.5px] text-alert">{err}</p>}
      </div>
    </div>
  );
}

function FileLink({ href, Icon, children }: { href: string | null; Icon: typeof BookOpen; children: React.ReactNode }) {
  const cls = "flex items-center gap-1.5 rounded-[8px] border border-[#dfe1ea] bg-[#eef0f6] px-3.5 py-2.5 text-[13.5px] font-medium";
  if (!href) return <span className={`${cls} opacity-50`} title="관리자가 파일을 올리면 받을 수 있습니다"><Icon size={16} />{children}</span>;
  return <a href={href} download className={cls}><Icon size={16} />{children}</a>;
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
        <rect x="24" y="118" width="13" height="20" {...stroke} />
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

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-[380px] rounded-[12px] bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="닫기"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
