import { randomUUID } from "node:crypto";
import type { Tables } from "./types";

// 로컬 모드 첫 실행 시 넣는 예시 데이터. 가격·주소 등은 확정 전 예시 값이다.

export function buildSeed() {
  const now = new Date().toISOString();
  const productId = randomUUID();

  const categories: Tables["categories"][] = [
    { id: randomUUID(), slug: "best", name: "BEST", sort_order: 1, created_at: now },
    { id: randomUUID(), slug: "new", name: "NEW", sort_order: 2, created_at: now },
    { id: randomUUID(), slug: "towel", name: "TOWEL", sort_order: 3, created_at: now },
  ];

  const products: Tables["products"][] = [
    {
      id: productId,
      slug: "lollipop-stripe-towel",
      name_en: "Lollipop stripe towel",
      name_ko: "롤리팝 스트라이프 타월",
      category_slugs: ["best", "new", "towel"],
      is_visible: true,
      sort_order: 1,
      images: [
        { url: "/images/site/product-lollipop.jpg", alt: "롤리팝 스트라이프 타월" },
        { url: "/images/products/lollipop/stack-mixed.jpg", alt: "롤리팝 스트라이프 타월 5색" },
      ],
      specs: [
        { label: "소재", value: "40수 (그라운드 - 코튼 100% / 스트라이프 - 면 50% 극세사 25% 대나무 25%)" },
        { label: "중량", value: "200g" },
        { label: "사이즈", value: "수건 - 40×80cm / 라벨 - 4.5 × 6.5cm" },
        { label: "원산지", value: "대한민국" },
      ],
      spec_note: "* 수건 박스 별도 문의",
      towel_size: "40×80cm",
      detail_html: "",
      detail_images: [1, 2, 3, 4].map((i) => ({ url: `/images/products/lollipop/detail-${i}.jpg`, alt: "롤리팝 스트라이프 타월" })),
      notice_html:
        "<ul><li>모니터 환경에 따라 실제 원단 색상과 차이가 있을 수 있습니다.</li><li>라벨 디자인은 재단선 안쪽 안전 영역 안에 중요한 글자와 이미지를 넣어 주세요.</li><li>PDF 업로드 주문은 제작 가이드의 대지 사이즈를 지켜 주세요.</li></ul>",
      guide_html:
        "<ol><li>색상을 고르고 디자인 방식(에디터 편집 또는 PDF 업로드)을 선택합니다.</li><li>에디터에서 라벨을 디자인하고 저장하거나, PDF 파일을 올립니다.</li><li>수량을 정하고 장바구니에 담거나 바로 구매합니다.</li><li>결제가 끝나면 마이페이지에서 주문 상태를 확인할 수 있습니다.</li></ol>",
      shipping_info: [
        { label: "배송방법", value: "택배" },
        { label: "배송지역", value: "전국" },
        { label: "배송비용", value: "기본 택배비 3,000원\n도서산간 지역은 추가 금액이 청구됩니다." },
      ],
      base_price: 9000,
      vat_included: true, // 표시 가격 = 부가세 포함 (시안: 총액 9,200 = 공급가 8,364 + 부가세 836)
      allow_editor: true,
      allow_upload: true,
      label_width_mm: 65,
      label_height_mm: 45,
      label_bleed_mm: 2,
      label_safe_mm: 3,
      label_corner_mm: 0,
      label_pages: 1,
      allow_pages: false,
      created_at: now,
      updated_at: now,
    },
  ];

  const colors = [
    ["peach", "#f4c7c0"],
    ["soda", "#a8d5e5"],
    ["lemon", "#f1e49c"],
    ["melon", "#b5d9ad"],
    ["berry", "#c8b1d9"],
  ];
  const P = "/images/products/lollipop";
  // 목업(정면샷) 위 라벨 위치. label_x/y = 라벨 중심(목업 대비 %), label_w = 라벨 가로(긴 변) 길이(목업 폭 대비 %)
  // 정면샷에서 실측: 오른쪽 위, 시계방향 90도 회전
  const product_colors: Tables["product_colors"][] = colors.map(([name, swatch], i) => ({
    id: randomUUID(),
    product_id: productId,
    name,
    swatch,
    images: [
      { url: `${P}/front-v-${name}.jpg`, alt: `${name} 정면` },
      { url: `${P}/stack-${name}.jpg`, alt: `${name} 5장` },
    ],
    mockup_url: `${P}/front-${name}.jpg`,
    label_x: 90.86,
    label_y: 19.6,
    label_w: 8.1, // 실측 7.78% — 원래 라벨 가장자리가 비치지 않게 조금 크게
    label_rotate: 90,
    sort_order: i,
  }));

  const product_price_tiers: Tables["product_price_tiers"][] = [
    [1, 9000],
    [50, 8000],
    [100, 7200],
    [300, 6500],
  ].map(([min_qty, unit_price]) => ({ id: randomUUID(), product_id: productId, min_qty, unit_price }));

  const notices: Tables["notices"][] = [
    { id: randomUUID(), title: "공지사항 예시", body_html: "<p>관리자 페이지에서 공지사항을 작성하면 여기에 표시됩니다.</p>", is_pinned: false, created_at: now, updated_at: now },
  ];

  // 에디터 디자인 템플릿 (작업 사이즈 69×49mm, 1mm = 10 단위, 객체 기준점은 가운데)
  const label = { widthMm: 65, heightMm: 45, bleedMm: 2, safeMm: 3, cornerMm: 0, pages: 1, allowPages: false };
  const text = (t: string, o: Record<string, unknown>) => ({ type: "Textbox", originX: "center", originY: "center", text: t, textAlign: "center", fill: "#221817", width: 560, splitByGrapheme: true, tw: { kind: "text" }, ...o });
  const doc = (background: string, objects: object[]) => ({ v: 1, unit: "mm", k: 10, label, pages: [{ version: "7.4.0", background, objects }] });
  const tpl = (name: string, category: string, d: object, sort: number): Tables["templates"] => ({
    id: randomUUID(), name, category, product_id: null, canvas_json: d, thumbnail_url: null, is_visible: true, sort_order: sort, created_at: now,
  });
  const templates: Tables["templates"][] = [
    tpl("이름 라벨", "이름", doc("#ffffff", [
      { type: "Rect", originX: "center", originY: "center", left: 345, top: 245, width: 590, height: 390, fill: "", stroke: "#221817", strokeWidth: 4 },
      text("이름", { left: 345, top: 245, fontSize: 120, fontFamily: "Noto Serif KR", fontWeight: "bold" }),
    ]), 1),
    tpl("브랜드 로고형", "로고", doc("#1c2c77", [
      text("BRAND", { left: 345, top: 225, fontSize: 120, fontFamily: "Playfair Display", fontWeight: "bold", fill: "#ffffff", charSpacing: 120 }),
      text("EST. 2026", { left: 345, top: 330, fontSize: 36, fontFamily: "Poppins", fill: "#ffffff", charSpacing: 300 }),
    ]), 2),
    tpl("스트라이프", "패턴", doc("#f9f6c9", [
      ...[120, 300, 480, 660].map((x) => ({ type: "Rect", originX: "center", originY: "center", left: x, top: 245, width: 70, height: 900, angle: 35, fill: "#c8b1d9" })),
      { type: "Rect", originX: "center", originY: "center", left: 345, top: 245, width: 420, height: 150, fill: "#ffffff" },
      text("TEXT", { left: 345, top: 245, fontSize: 90, fontFamily: "Poppins", fontWeight: "600", width: 400 }),
    ]), 3),
    tpl("심플 원형", "심플", doc("#ffffff", [
      { type: "Circle", originX: "center", originY: "center", left: 345, top: 245, radius: 170, fill: "#e8bdc6" },
      text("Hello", { left: 345, top: 245, fontSize: 110, fontFamily: "Gaegu", fontWeight: "bold", width: 400 }),
    ]), 4),
  ];

  const stickers: Tables["stickers"][] = ["heart", "star", "flower", "leaf", "smile", "cloud", "sun", "sparkle", "lemon", "stripe-ribbon"].map((n, i) => ({
    id: randomUUID(), name: n, category: "아이콘", url: `/stickers/${n}.svg`, sort_order: i, created_at: now,
  }));

  return {
    profiles: [],
    categories,
    products,
    product_colors,
    product_price_tiers,
    product_files: [],
    templates,
    stickers,
    designs: [],
    design_uploads: [],
    wishlists: [],
    cart_items: [],
    orders: [],
    order_items: [],
    quote_requests: [],
    notices,
    ai_generations: [],
    site_settings: [],
    site_contents: [],
    _auth_users: [],
  };
}
