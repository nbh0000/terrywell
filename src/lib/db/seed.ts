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
        { label: "사이즈", value: "수건 - 40×80cm / 라벨 - 6.5×4.5cm" },
        { label: "원산지", value: "대한민국" },
      ],
      spec_note: "* 수건 박스 별도 문의",
      towel_size: "40×80cm",
      detail_html: "",
      detail_images: [],
      notice_html: "",
      guide_html: "",
      shipping_info: [
        { label: "배송방법", value: "택배" },
        { label: "배송지역", value: "전국" },
        { label: "배송비", value: "3,000원 (50,000원 이상 무료)" },
      ],
      base_price: 9000,
      vat_included: false,
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
  // 목업(정면샷) 위 라벨 위치: 오른쪽 위 세로 라벨 자리 (이미지 대비 %, 3단계 에디터 미리보기용)
  const product_colors: Tables["product_colors"][] = colors.map(([name, swatch], i) => ({
    id: randomUUID(),
    product_id: productId,
    name,
    swatch,
    images: [
      { url: `${P}/stack-${name}.jpg`, alt: `${name} 5장` },
      { url: `${P}/front-${name}.jpg`, alt: `${name} 정면` },
    ],
    mockup_url: `${P}/front-${name}.jpg`,
    label_x: 91.6,
    label_y: 15.5,
    label_w: 4.2,
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

  return {
    profiles: [],
    categories,
    products,
    product_colors,
    product_price_tiers,
    product_files: [],
    templates: [],
    stickers: [],
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
