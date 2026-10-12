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
      name_ko: "롤리팝 스트라이프 타월 5P 세트",
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
        { label: "사이즈", value: "수건 - 40×80cm / 라벨 - 6.5 × 4.5cm" },
        { label: "구성", value: "5장 1세트 (5개 단위 주문)" },
        { label: "원산지", value: "대한민국" },
      ],
      spec_note: "* 수건 박스 별도 문의",
      towel_size: "40×80cm",
      detail_html: "",
      detail_images: [1, 2, 3].map((i) => ({ url: `/images/products/lollipop/detail-${i}.jpg`, alt: "롤리팝 스트라이프 타월" })),
      notice_html:
        "<ul><li>모니터 환경에 따라 실제 원단 색상과 차이가 있을 수 있습니다.</li><li>라벨 디자인은 재단선 안쪽 안전 영역(5.8×3.8cm) 안에 중요한 글자와 이미지를 넣어 주세요.</li><li>혼합 색상은 선택하신 구성에 따라 각 수건을 한 장씩 제작해 보내드립니다.</li></ul>",
      guide_html:
        "<ol><li>색상을 고르고 [디자인하기]를 누릅니다.</li><li>에디터에서 라벨을 디자인하고 저장합니다. 이미지·PDF 파일을 불러오거나 카메라로 찍어 넣을 수 있습니다.</li><li>수량(5개 단위)을 정하고 장바구니에 담거나 바로 구매합니다.</li><li>결제가 끝나면 마이페이지에서 주문 상태를 확인할 수 있습니다.</li></ol>",
      shipping_info: [
        { label: "배송방법", value: "택배" },
        { label: "배송지역", value: "전국" },
        { label: "배송비용", value: "기본 택배비 3,000원\n도서산간 지역은 추가 금액이 청구됩니다." },
      ],
      base_price: 9000,
      vat_included: true, // 표시 가격 = 부가세 포함 (시안: 총액 9,200 = 공급가 8,364 + 부가세 836)
      allow_editor: true,
      allow_upload: false, // 2026-10 고객 요청: PDF 업로드 대신 에디터에서 파일 불러오기
      // 고객 제작 가이드: 작업(업로드) 6.8×4.8cm, 실제 라벨 6.5×4.5cm, 안전 영역 5.8×3.8cm
      label_width_mm: 65,
      label_height_mm: 45,
      label_bleed_mm: 1.5,
      label_safe_mm: 3.5,
      label_corner_mm: 0,
      label_pages: 1,
      allow_pages: false,
      qty_step: 5,
      released_at: now,
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
  // 목업 = 세로 정면샷(라벨 오른쪽 아래). label_x/y = 라벨 중심(목업 대비 %), label_w = 라벨 가로(목업 폭 대비 %)
  // 2026-10 고객이 보낸 풀샷의 빈 라벨 위치를 실측하고, 테두리가 비치지 않게 4% 크게 덮는다
  const LABEL_POS: Record<string, { x: number; y: number; w: number }> = {"peach": {"x": 81.82, "y": 90.41, "w": 16.74}, "soda": {"x": 81.44, "y": 90.12, "w": 17.71}, "lemon": {"x": 79.74, "y": 90.68, "w": 16.26}, "melon": {"x": 82.7, "y": 90.56, "w": 16.7}, "berry": {"x": 81.58, "y": 90.82, "w": 16.92}};
  const colorRow = (name: string, swatch: string, i: number, mix = false): Tables["product_colors"] => {
    const base = mix ? "peach" : name; // 혼합은 대표 색상(peach) 사진으로 보여 준다
    return {
      id: randomUUID(),
      product_id: productId,
      name,
      swatch,
      images: [
        { url: `${P}/front-v-${base}.jpg`, alt: `${name} 정면` },
        { url: mix ? `${P}/stack-mixed.jpg` : `${P}/stack-${name}.jpg`, alt: `${name} 5장` },
      ],
      mockup_url: `${P}/front-v-${base}.jpg`,
      label_x: LABEL_POS[base].x,
      label_y: LABEL_POS[base].y,
      label_w: LABEL_POS[base].w,
      label_rotate: 0,
      is_mix: mix,
      sort_order: i,
    };
  };
  const product_colors: Tables["product_colors"][] = [
    ...colors.map(([name, swatch], i) => colorRow(name, swatch, i)),
    colorRow("mix", "linear-gradient(90deg,#f4c7c0 0 20%,#a8d5e5 0 40%,#f1e49c 0 60%,#b5d9ad 0 80%,#c8b1d9 0)", colors.length, true),
  ];

  // 단가표는 화면에서 뺐다(2026-10 고객 요청). 구간 단가가 다시 필요하면 관리자에서 넣는다
  const product_price_tiers: Tables["product_price_tiers"][] = [
    [1, 9000],
  ].map(([min_qty, unit_price]) => ({ id: randomUUID(), product_id: productId, min_qty, unit_price }));

  const notices: Tables["notices"][] = [
    { id: randomUUID(), title: "공지사항 예시", body_html: "<p>관리자 페이지에서 공지사항을 작성하면 여기에 표시됩니다.</p>", is_pinned: false, created_at: now, updated_at: now },
  ];

  // 에디터 디자인 템플릿 (만들 때 작업 사이즈 69×49mm. 적용할 때 제품 라벨 크기에 맞춰 늘린다, 1mm = 10 단위, 객체 기준점은 가운데)
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
    faqs: buildFaqs(now),
    inquiries: [],
    ai_generations: [],
    site_settings: [],
    site_contents: [],
    _auth_users: [],
  };
}

/** 자주 묻는 질문 기본값 (관리자 > 자주 묻는 질문에서 고친다) */
export function buildFaqs(now: string): Tables["faqs"][] {
  const rows: [string, string, string][] = [
    ["주문/결제", "결제 완료 후 디자인이나 옵션을 바꿀 수 있나요?", "제작이 시작되기 전이라면 1:1 문의로 알려 주세요. 제작이 시작된 뒤에는 맞춤 제작 상품이라 변경이 어렵습니다."],
    ["주문/결제", "최소 주문 수량이 있나요?", "롤리팝 스트라이프 타월은 5장 1세트로, 5개 단위로 주문할 수 있습니다."],
    ["주문/결제", "대량 주문은 어떻게 하나요?", "Q&A의 견적 문의로 수량과 희망 납기를 남겨 주시면 확인 후 연락드립니다."],
    ["주문/결제", "견적서나 거래명세서를 받을 수 있나요?", "마이페이지 > 주문 내역에서 주문별 견적서와 거래명세서를 바로 출력할 수 있습니다."],
    ["주문/결제", "세금계산서 발행이 되나요?", "주문서에서 세금계산서 발행 요청을 체크하고 사업자 정보를 입력해 주세요."],
    ["디자인", "어떤 파일을 라벨에 넣을 수 있나요?", "에디터의 [사진]에서 JPG, PNG, WEBP, SVG 이미지와 PDF, AI(PDF 호환으로 저장한 파일)를 불러올 수 있습니다. EPS 파일은 PDF로 저장해서 올려 주세요."],
    ["디자인", "라벨 크기는 얼마인가요?", "실제 라벨은 6.5×4.5cm입니다. 배경이 있는 디자인은 6.8×4.8cm(작업 사이즈)까지 채우고, 글자는 안전 영역 5.8×3.8cm 안에 넣어 주세요."],
    ["디자인", "작업하던 디자인을 나중에 이어서 할 수 있나요?", "에디터 위쪽의 [임시저장]을 누르면 마이페이지 > 저장한 디자인에서 다시 열어 이어서 편집할 수 있습니다."],
    ["디자인", "혼합 색상은 어떻게 제작되나요?", "혼합 옵션은 대표 색상 1장만 보여드린 예시 이미지입니다. 실제 주문 시에는 선택하신 혼합 구성에 따라 각 수건을 한 장씩 제작하여 보내드립니다."],
    ["배송", "제작과 배송은 얼마나 걸리나요?", "디자인 확인 후 제작에 들어가며, 제작이 끝나면 택배로 발송합니다. 자세한 일정은 주문 후 안내드립니다."],
    ["배송", "배송비는 얼마인가요?", "기본 택배비는 3,000원이며 도서산간 지역은 추가 금액이 청구됩니다."],
    ["반품/교환/취소", "주문을 취소하고 싶어요.", "제작 시작 전에는 1:1 문의로 취소를 요청해 주세요. 제작이 시작된 맞춤 제작 상품은 단순 변심에 의한 취소가 어렵습니다."],
    ["반품/교환/취소", "받은 상품에 문제가 있어요.", "상품을 받으신 날로부터 7일 안에 사진과 함께 1:1 문의를 남겨 주시면 확인 후 교환해 드립니다."],
    ["그 외", "비회원도 주문할 수 있나요?", "디자인 저장과 주문은 회원만 할 수 있습니다. 주문 내역은 로그인 화면의 [비회원 주문 조회]에서 주문번호와 연락처로도 확인할 수 있습니다."],
  ];
  return rows.map(([category, question, answer], i) => ({
    id: randomUUID(),
    category,
    question,
    answer_html: `<p>${answer}</p>`,
    is_visible: true,
    sort_order: i,
    created_at: now,
  }));
}
