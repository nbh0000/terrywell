import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { OrderStatus } from "@/lib/db/types";
import { STATUS_LABEL } from "@/lib/orders";
import { won } from "@/lib/pricing";
import { btnCls, Card, dt, inputCls, PageTitle } from "../../ui";

export const metadata = { title: "주문 상세" };

async function updateOrder(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id"));
  const status = String(fd.get("status")) as OrderStatus;
  if (!Object.keys(STATUS_LABEL).includes(status)) return;
  await getDb({ admin: true }).update("orders", { id }, { status, tracking_no: String(fd.get("tracking_no") ?? "").trim() || null, updated_at: new Date().toISOString() });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

export default async function AdminOrder({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const db = getDb({ admin: true });
  const o = await db.get("orders", { id });
  if (!o) notFound();
  const [items, member] = await Promise.all([db.select("order_items", { where: { order_id: id } }), db.get("profiles", { id: o.user_id })]);
  const files = await Promise.all(
    items.map(async (it) => ({
      design: it.design_id ? await db.get("designs", { id: it.design_id }) : null,
      upload: it.upload_id ? await db.get("design_uploads", { id: it.upload_id }) : null,
    })),
  );
  const r = o.recipient;
  const pay = o.payment as Record<string, unknown> | null;

  return (
    <>
      <PageTitle title={`주문 ${o.order_no}`}>
        <Link href="/admin/orders" className="text-[13px] text-muted underline">목록</Link>
      </PageTitle>
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card title="주문 상품 · 인쇄 파일">
            <ul className="divide-y divide-line">
              {items.map((it, i) => {
                const f = files[i];
                return (
                  <li key={it.id} className="flex flex-wrap gap-4 py-4 text-[14px]">
                    <div className="w-32 shrink-0 bg-cloud">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {f.design?.thumbnail_url && <img src={f.design.thumbnail_url} alt="" className="w-full" />}
                      {f.upload && <p className="p-3 text-center text-[12px] text-muted">업로드 파일</p>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{it.product_name}{it.color_name ? ` · ${it.color_name}` : ""}</p>
                      <p className="text-muted">{it.quantity.toLocaleString()}개 × {won(it.unit_price)} = {won(it.line_amount)}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[13px]">
                        {f.design && (
                          <>
                            {f.design.print_png_url && <a className="rounded-[6px] border border-line px-2.5 py-1 hover:border-ink/40" href={f.design.print_png_url} download>인쇄용 PNG (300dpi)</a>}
                            {f.design.print_pdf_url && <a className="rounded-[6px] border border-line px-2.5 py-1 hover:border-ink/40" href={f.design.print_pdf_url} download>PDF</a>}
                            {f.design.print_cmyk_url && <a className="rounded-[6px] border border-line px-2.5 py-1 hover:border-ink/40" href={f.design.print_cmyk_url} download>CMYK TIFF</a>}
                          </>
                        )}
                        {f.upload && <a className="rounded-[6px] border border-line px-2.5 py-1 hover:border-ink/40" href={`/api/files/uploads/${f.upload.storage_path}`} download={f.upload.file_name}>{f.upload.file_name}</a>}
                        {!f.design && !f.upload && <span className="text-alert">디자인 파일을 찾을 수 없습니다</span>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-[14px]">
              <div className="flex justify-between"><dt>공급가액</dt><dd>{won(o.supply_amount)}</dd></div>
              <div className="flex justify-between"><dt>부가세</dt><dd>{won(o.vat_amount)}</dd></div>
              <div className="flex justify-between"><dt>배송비</dt><dd>{won(o.shipping_fee)}</dd></div>
              <div className="flex justify-between font-semibold"><dt>합계</dt><dd>{won(o.total_amount)}</dd></div>
            </dl>
          </Card>
          <Card title="배송 정보">
            <dl className="grid grid-cols-[90px_1fr] gap-y-1.5 text-[14px]">
              <dt className="text-muted">받는 분</dt><dd>{String(r.name ?? "")}</dd>
              <dt className="text-muted">연락처</dt><dd>{String(r.phone ?? "")}</dd>
              <dt className="text-muted">주소</dt><dd>({String(r.zip ?? "")}) {String(r.address1 ?? "")} {String(r.address2 ?? "")}</dd>
              <dt className="text-muted">메모</dt><dd>{String(r.memo ?? "") || "-"}</dd>
              <dt className="text-muted">주문 회원</dt><dd>{member ? `${member.name} (${member.email})` : "-"}</dd>
            </dl>
          </Card>
          {o.tax_invoice && (
            <Card title="세금계산서 요청">
              <dl className="grid grid-cols-[110px_1fr] gap-y-1.5 text-[14px]">
                {([["상호", "company_name"], ["사업자등록번호", "business_number"], ["대표자", "ceo"], ["이메일", "email"], ["업태", "business_type"], ["종목", "business_item"]] as const).map(([l, k]) => (
                  <div key={k} className="contents"><dt className="text-muted">{l}</dt><dd>{String(o.tax_invoice?.[k] ?? "") || "-"}</dd></div>
                ))}
              </dl>
            </Card>
          )}
        </div>
        <div className="space-y-4">
          <Card title="처리">
            <form action={updateOrder} className="space-y-3">
              <input type="hidden" name="id" value={o.id} />
              <label className="block text-[13px]">상태
                <select name="status" defaultValue={o.status} className={`${inputCls} mt-1`}>
                  {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </label>
              <label className="block text-[13px]">송장번호
                <input name="tracking_no" defaultValue={o.tracking_no ?? ""} className={`${inputCls} mt-1`} />
              </label>
              <button className={`${btnCls} w-full`}>저장</button>
            </form>
          </Card>
          <Card title="결제">
            <dl className="space-y-1 text-[13px]">
              <div className="flex justify-between"><dt className="text-muted">주문일시</dt><dd>{dt(o.created_at)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">결제 수단</dt><dd>{pay?.provider === "mock" ? "테스트 결제" : String(pay?.provider ?? "-")}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">결제 ID</dt><dd className="truncate pl-3">{String(pay?.paymentId ?? "-")}</dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
