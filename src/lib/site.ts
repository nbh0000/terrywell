import "server-only";
import { getDb } from "@/lib/db";
import { IMAGES } from "@/content/images";

// 관리자 "사이트 설정 / 콘텐츠" 에서 수정하는 값의 모양과 기본값.
// DB 에 값이 없으면 기본값을 쓰므로, 새 키를 추가해도 바로 동작한다.

export interface CompanyInfo {
  company_name: string;
  address: string;
  ceo: string;
  business_number: string;
  mail_order_number: string;
  phone: string;
  email: string;
  hours_weekday: string;
  hours_lunch: string;
}

export interface HomeContent {
  hero: { image: string | null; title: string; slogan: string };
  cards: { title: string; subtitle: string; image: string | null; href: string }[];
  banner: { image: string | null; title: string; badge: string; button: string; href: string };
}

export const DEFAULT_SETTINGS = {
  company: {
    // 시안 푸터 값 + 고객 정보.txt. 통신판매업번호는 아직 없다
    company_name: "주식회사 테리웰",
    address: "대전광역시 대덕구 무지니1길 49",
    ceo: "이수빈",
    business_number: "381-86-04118",
    mail_order_number: "",
    phone: "042-716-4997", // assets/website/정보.txt
    email: "sales@terrywell.kr",
    hours_weekday: "월-금 10:00 - 17:00",
    hours_lunch: "점심시간 11:30-13:00",
  } satisfies CompanyInfo,
  shipping: { fee: 3000, free_over: 0 }, // free_over 0 = 무료배송 기준 없음
  ai: { enabled: true, daily_free_limit: 10, styles: ["일러스트", "미니멀", "수채화", "로고형", "패턴"] },
};

export const DEFAULT_CONTENTS = {
  home: {
    hero: { image: IMAGES.homeHero, title: "TERRYWELL", slogan: "A Better Everyday, Woven into Every Towel." },
    cards: [
      { title: "Collection", subtitle: "제품", image: IMAGES.cardCollection, href: "/products" },
      { title: "Custom", subtitle: "커스텀 라벨", image: IMAGES.cardCustom, href: "/custom-label" },
      { title: "Quality", subtitle: "원단, 인증, 제작방식", image: IMAGES.cardQuality, href: "/about#quality" },
      { title: "Journal", subtitle: "브랜드 소식, 스타일링", image: IMAGES.cardJournal, href: "/notices" },
    ],
    banner: {
      image: IMAGES.homeBanner,
      title: "Lollipop Stripe Towel",
      badge: "NEW",
      button: "바로가기",
      href: "/products/lollipop-stripe-towel",
    },
  } satisfies HomeContent,
  // 문구는 reference/01 시안 그대로. 문단 = 줄 배열
  about: {
    heading: ["Better", "Better", "Better"],
    image1: IMAGES.about1,
    image2: IMAGES.about2,
    paragraphs: [
      ["하루는 모두에게 같은 시간으로 주어지지만,그 안에 담긴 이야기는", "모두 다릅니다."],
      ["분주한 아침,여유로운 오후, 소중한 사람과 함께하는 순간,", "혼자만의 쉼을 누리는 시간까지."],
      ["우리는 저마다의 일상이 그 자체로 충분히 소중하다고 믿습니다."],
      ["Terrywell은 단순히 수건을 만드는 것이 아니라,", "당신의 하루를 함께하는 순간을 생각합니다."],
      ["매일 가장 가까이에서 닿는 한 장의 수건이 익숙한 일상 속 작은", "편안함이 되고, 오래 기억될 따뜻한 순간이 되기를 바랍니다."],
      ["우리는 수건에 여러분의 일상을 담습니다."],
    ],
  },
  // 이용약관 · 개인정보처리방침 (초안. 고객사 검토 후 관리자에서 확정)
  legal: {
    terms: [
      "<h3>제1조 (목적)</h3><p>이 약관은 주식회사 테리웰(이하 \"회사\")이 운영하는 온라인 쇼핑몰에서 제공하는 상품 판매 및 라벨 디자인 서비스의 이용 조건과 절차를 정합니다.</p>",
      "<h3>제2조 (회원가입)</h3><p>이용자는 회사가 정한 양식에 따라 회원정보를 입력하고 약관에 동의하여 회원가입을 신청합니다.</p>",
      "<h3>제3조 (주문과 결제)</h3><p>이용자는 상품 선택, 디자인 완료(에디터 저장 또는 파일 업로드), 수량 선택 후 결제하여 주문합니다. 결제 금액은 단가표와 수량에 따라 정해집니다.</p>",
      "<h3>제4조 (맞춤 제작 상품)</h3><p>라벨이 부착되는 맞춤 제작 상품은 제작이 시작된 후에는 단순 변심에 의한 취소·반품이 제한될 수 있습니다. 이용자가 제작 가이드를 지키지 않은 파일로 인해 생긴 문제는 회사가 책임지지 않습니다.</p>",
      "<h3>제5조 (AI 이미지 생성)</h3><p>AI 생성 기능은 회원에게 하루 정해진 횟수 안에서 무료로 제공되며, 회사는 운영 상황에 따라 횟수와 제공 여부를 바꿀 수 있습니다. 이용자는 타인의 권리를 침해하는 내용을 생성·주문해서는 안 됩니다.</p>",
      "<h3>제6조 (배송)</h3><p>배송 방법, 지역, 비용은 상품 상세의 배송 안내를 따릅니다.</p>",
    ].join(""),
    privacy: [
      "<h3>1. 수집하는 개인정보</h3><ul><li>회원가입: 이메일, 비밀번호, 이름, 연락처</li><li>주문: 받는 분 이름, 연락처, 주소, 배송 메모</li><li>세금계산서 요청 시: 상호, 사업자등록번호, 대표자, 이메일, 업태, 종목</li><li>견적문의: 회사명, 이름, 연락처, 이메일, 문의 내용, 첨부 파일</li></ul>",
      "<h3>2. 이용 목적</h3><p>회원 관리, 주문·결제·배송 처리, 세금계산서 발행, 견적 상담, AI 생성 이용 횟수 관리</p>",
      "<h3>3. 보관 기간</h3><p>회원 탈퇴 시 지체 없이 파기합니다. 다만 전자상거래 등에서의 소비자보호에 관한 법률에 따라 계약·결제 기록은 5년, 소비자 불만 처리 기록은 3년 보관합니다.</p>",
      "<h3>4. 처리 위탁</h3><p>결제 처리(포트원·PG사), 배송(택배사), 서버·데이터 보관 업체에 필요한 범위에서 위탁합니다.</p>",
      "<h3>5. 문의</h3><p>개인정보 관련 문의는 고객센터 전화 또는 이메일로 연락해 주세요.</p>",
    ].join(""),
  },
  // 에디터 편집 가이드 모달의 유의사항 (기본값은 시안 문구)
  editorGuide: {
    notes: [
      { title: "PDF 후가공 레이어 주문X", body: "PDF 파일에 후가공 레이어가 포함되어 있더라도 후가공 레이어는 무시됩니다." },
      { title: "화이트 인쇄 > 자동화이트", body: "화이트 인쇄 옵션 선택 시 업로드하신 이미지 영역에 맞춰 자동으로 화이트 인쇄가 적용됩니다. 화이트 인쇄 레이어가 포함된 PDF 파일을 업로드하더라도, 화이트 레이어는 무시됩니다." },
    ],
  },
  // 제품 상세 PDF 업로드 필수 동의 (명세 3-6 문구)
  pdfConsent: {
    items: [
      "제작 가이드에 명시된 색상, 레이어의 이름 및 순서, 대지 사이즈 등을 반드시 지켜주세요.",
      "제작 가이드를 준수하지 않은 파일로 인해 발생한 모든 문제에 대해 테리웰의 책임이 없음을 확인합니다.",
    ],
  },
  customLabel: {
    image: IMAGES.customLabel,
    title: "CUSTOM LABEL",
    paragraphs: [
      [
        "자수는 오랫동안 사랑받아온 제작 방식이지만, 색상과 디자인 표현에는 일정한 제약이 있었습니다.",
        "더 다양한 고객의 아이디어를 담기 위해 원하는 디자인 그대로 제작하는 커스텀 라벨 서비스를 시작했습니다.",
      ],
      [
        "커스텀 라벨은 고객이 직접 원하는 디자인으로 제작하는 맞춤형 라벨입니다.",
        "사진, 로고, 문구, 일러스트, 캐릭터 등 원하는 콘텐츠를 자유롭게 담을 수 있으며,색상과 형태의 제약 없이",
        "브랜드와 제품에 어울리는 라벨을 제작해 드립니다.",
      ],
      [
        "브랜드 홍보, 제품 패키지, 광고, 이벤트, 굿즈 등 다양한 분야에서 활용할 수 있으며",
        "하나의 라벨에도 브랜드만의 개성과 가치를 담아드립니다.",
      ],
    ],
  },
};

type Settings = typeof DEFAULT_SETTINGS;
type Contents = typeof DEFAULT_CONTENTS;

export async function getSetting<K extends keyof Settings>(key: K): Promise<Settings[K]> {
  const row = await getDb().get("site_settings", { key });
  return { ...DEFAULT_SETTINGS[key], ...((row?.value as object) ?? {}) } as Settings[K];
}

export async function getContent<K extends keyof Contents>(key: K): Promise<Contents[K]> {
  const row = await getDb().get("site_contents", { key });
  return { ...DEFAULT_CONTENTS[key], ...((row?.value as object) ?? {}) } as Contents[K];
}
