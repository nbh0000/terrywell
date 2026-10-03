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
    company_name: "주식회사 테리웰",
    address: "대전광역시 (주소 입력 예정)",
    ceo: "(대표자명)",
    business_number: "000-00-00000",
    mail_order_number: "제0000-대전-0000호",
    phone: "042-0000-0000",
    email: "sales@terrywell.kr",
    hours_weekday: "월-금 10:00 - 17:00",
    hours_lunch: "점심시간 11:30 - 13:00",
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
