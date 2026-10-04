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
