import "server-only";
import sharp from "sharp";

// AI 이미지 생성 어댑터. AI_PROVIDER 로 고른다 (mock | openai | google).
// 키는 서버 환경변수로만 읽고 클라이언트에 보내지 않는다.

export interface GenerateInput {
  prompt: string; // 사용자 입력 (한국어 가능)
  style: string; // 스타일 칩 이름
  aspect: { w: number; h: number }; // 라벨 비율 (가로형)
  count: number;
}

export interface AiProvider {
  name: string;
  /** 장당 예상 비용(원). 관리자 사용량 화면의 추정치에 쓴다 */
  costPerImageKrw: number;
  generate(input: GenerateInput): Promise<Buffer[]>;
}

// 스타일 칩 → 영어 지시문
const STYLE_HINT: Record<string, string> = {
  일러스트: "flat vector illustration, clean shapes",
  미니멀: "minimal design, simple shapes, lots of empty space",
  수채화: "soft watercolor painting, gentle texture",
  로고형: "logo-style emblem, bold simple mark, centered",
  패턴: "seamless repeating pattern",
};

export function buildPrompt(input: GenerateInput) {
  const style = STYLE_HINT[input.style] ?? input.style;
  return [
    `Artwork for a small woven/printed towel label, ${input.aspect.w}:${input.aspect.h} landscape.`,
    `Subject: ${input.prompt}.`,
    style ? `Style: ${style}.` : "",
    "Printable on fabric, high contrast, no photographic background clutter, no watermark, no text unless the subject asks for text.",
  ]
    .filter(Boolean)
    .join(" ");
}

/** 키 없이 동작하는 목업: 프롬프트로 색과 도형이 정해지는 그림을 만든다 (비용 없음) */
const mock: AiProvider = {
  name: "mock",
  costPerImageKrw: 0,
  async generate(input) {
    const W = 1300;
    const H = Math.round((W * input.aspect.h) / input.aspect.w);
    let seed = [...`${input.prompt}|${input.style}`].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    const pastel = () => `hsl(${Math.floor(rnd() * 360)},${45 + rnd() * 25}%,${72 + rnd() * 14}%)`;
    const out: Buffer[] = [];
    for (let i = 0; i < input.count; i++) {
      const bg = pastel();
      const shapes = Array.from({ length: 7 }, () => {
        const x = rnd() * W, y = rnd() * H, r = 60 + rnd() * 220;
        return rnd() > 0.5
          ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${pastel()}" opacity="0.85"/>`
          : `<rect x="${x - r / 2}" y="${y - r / 2}" width="${r}" height="${r * 0.7}" rx="${r * 0.2}" fill="${pastel()}" opacity="0.85" transform="rotate(${rnd() * 60 - 30} ${x} ${y})"/>`;
      }).join("");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${bg}"/>${shapes}
        <text x="50%" y="94%" text-anchor="middle" font-family="sans-serif" font-size="34" fill="rgba(0,0,0,0.35)">MOCK · ${escapeXml(input.style)}</text></svg>`;
      out.push(await sharp(Buffer.from(svg)).png().toBuffer());
    }
    return out;
  },
};

/** OpenAI gpt-image-1 */
const openai: AiProvider = {
  name: "openai",
  costPerImageKrw: Number(process.env.AI_COST_PER_IMAGE_KRW ?? 250),
  async generate(input) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY 가 설정되지 않았습니다.");
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1", prompt: buildPrompt(input), size: "1536x1024", n: input.count }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) throw new Error(`OpenAI 오류 (${res.status})`);
    const data = (await res.json()) as { data: { b64_json: string }[] };
    return data.data.map((d) => Buffer.from(d.b64_json, "base64"));
  },
};

/** Google Imagen (Gemini API) */
const google: AiProvider = {
  name: "google",
  costPerImageKrw: Number(process.env.AI_COST_PER_IMAGE_KRW ?? 60),
  async generate(input) {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) throw new Error("GOOGLE_API_KEY 가 설정되지 않았습니다.");
    const model = process.env.GOOGLE_IMAGE_MODEL ?? "imagen-4.0-generate-001";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ instances: [{ prompt: buildPrompt(input) }], parameters: { sampleCount: input.count, aspectRatio: "4:3" } }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) throw new Error(`Google 이미지 생성 오류 (${res.status})`);
    const data = (await res.json()) as { predictions?: { bytesBase64Encoded: string }[] };
    return (data.predictions ?? []).map((p) => Buffer.from(p.bytesBase64Encoded, "base64"));
  },
};

export function getProvider(): AiProvider {
  const name = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  if (name === "openai") return openai;
  if (name === "google") return google;
  return mock;
}

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[c]!);
}
