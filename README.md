# TERRYWELL (terrywell.kr)

커스텀 라벨 수건 쇼핑몰. 웹 라벨 에디터(AI 이미지 생성 포함), 제품·장바구니·결제, 관리자 페이지.

- 명세: `CLAUDE.md` · 결정 사항: `DECISIONS.md` · 시안: `reference/`
- Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase · Fabric.js 7 · 포트원 V2

---

## 1. 로컬에서 실행

```bash
npm install
npm run dev        # http://localhost:3000
```

`.env.local` 이 없으면 **로컬 모드**로 동작한다.

- 데이터: `.data/db.json` (첫 실행 때 예시 데이터 생성)
- 파일: `.data/storage/` (디자인 인쇄 파일, 업로드, AI 이미지)
- 관리자 계정: 첫 실행 때 만들어지고 접속 정보는 `.data/admin-login.txt`
- 결제: 포트원 키가 없으면 사이트 안의 **테스트 결제**로 완료된다
- AI: `AI_PROVIDER=mock` 이면 비용 없는 목업 이미지가 나온다

> 로컬 모드는 개발 확인용이다. Vercel 같은 서버리스 환경은 파일을 저장할 수 없으므로 **배포 시에는 Supabase 가 필요**하다.

데이터를 처음 상태로 되돌리려면 서버를 끄고 `.data/` 폴더를 지운 뒤 다시 실행한다.

---

## 2. Supabase 설정

1. https://supabase.com 에서 프로젝트를 만든다 (Region: Northeast Asia (Seoul)).
2. **SQL Editor** 에서 `supabase/migrations/0001_init.sql` 내용을 붙여넣고 실행한다.
   테이블 19개, 권한 규칙(RLS), 스토리지 버킷 6개가 만들어진다.
3. **Project Settings → API** 에서 값을 복사해 `.env.local` 에 넣는다.
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...      # 서버 전용, 절대 공개 금지
   ```
4. 예시 데이터 넣기: `npm run seed:supabase`
5. 사이트에서 회원가입한 뒤, SQL Editor 에서 관리자로 지정한다.
   ```sql
   update public.profiles set role = 'admin' where email = '관리자@이메일';
   ```
6. **Authentication → URL Configuration** 의 Site URL 을 실제 주소(`https://terrywell.kr`)로,
   Redirect URLs 에 `https://terrywell.kr/**` 를 넣는다 (가입 인증·비밀번호 재설정 메일 링크).

---

## 3. 결제 (포트원 V2 + 토스페이먼츠)

1. https://admin.portone.io 가입 → **결제 연동 → 연동 정보**
2. 테스트 채널 추가: PG사 **토스페이먼츠**, 결제 방식 **카드**
3. `.env.local` 에 넣는다.
   ```
   NEXT_PUBLIC_PORTONE_STORE_ID=store-...
   NEXT_PUBLIC_PORTONE_CHANNEL_KEY=channel-key-...
   PORTONE_API_SECRET=...            # V2 API Secret, 서버 전용
   ```
4. 결제 후 서버가 포트원 결제 조회 API 로 **금액과 상태를 다시 확인**한 뒤 주문을 결제완료로 바꾼다.
5. 실결제는 토스페이먼츠 가맹 계약 후 실연동 채널 키로 바꾸면 된다.

---

## 4. AI 이미지 생성

`.env.local` 에서 고른다. 키는 서버에서만 쓰이고 브라우저에 보내지 않는다.

| AI_PROVIDER | 필요한 키 | 비고 |
|---|---|---|
| `mock` | 없음 | 개발용 목업 그림 |
| `openai` | `OPENAI_API_KEY` | 기본 모델 `gpt-image-1` |
| `google` | `GOOGLE_API_KEY` | 기본 모델 `imagen-4.0-generate-001` |

- 1인 하루 무료 횟수(기본 10회), 사용 ON/OFF, 스타일 칩은 **관리자 → AI 설정**에서 바꾼다.
- 횟수는 서버에서 한국시간 기준으로 센다. 실패한 생성은 횟수에서 빠진다.
- `AI_COST_PER_IMAGE_KRW` 를 넣으면 관리자 사용량 화면에 추정 비용이 나온다.

---

## 5. Vercel 배포

1. GitHub 에 저장소를 올리고 https://vercel.com 에서 Import 한다 (Framework: Next.js).
2. **Settings → Environment Variables** 에 `.env.example` 의 값을 모두 넣는다.
   `NEXT_PUBLIC_SITE_URL=https://terrywell.kr` 도 넣는다.
3. Deploy.
4. 디자인 저장(인쇄 PNG·PDF·CMYK 생성)에 `sharp` 를 쓰며, Vercel Node 런타임에서 그대로 동작한다.
   요청 본문 한도는 `next.config.ts` 에서 60MB 로 늘려 두었다 (디자인 저장, PDF 업로드 50MB).
   > Vercel 서버리스 함수는 요청 본문이 약 4.5MB 로 제한되므로, 큰 PDF 업로드는 Supabase Storage 직접 업로드로 바꿔야 한다 (TODO).

### 도메인 연결 (terrywell.kr)

1. Vercel 프로젝트 → **Settings → Domains** 에서 `terrywell.kr`, `www.terrywell.kr` 추가
2. 도메인 업체 DNS 에 Vercel 이 안내하는 값을 넣는다.
   - `terrywell.kr` → A 레코드 `76.76.21.21`
   - `www` → CNAME `cname.vercel-dns.com`
3. 연결 후 Supabase Auth 의 Site URL 과 포트원 결제 도메인도 실제 주소로 맞춘다.

---

## 6. GitHub Pages 미리보기판

https://nbh0000.github.io/terrywell/ — 공개 페이지와 라벨 에디터를 정적 HTML 로 떠서 올린 **보기 전용** 사이트다.
로그인·장바구니·결제·디자인 저장·AI 생성은 동작하지 않는다 (서버가 필요).

다시 만들기 (PowerShell):

```powershell
$env:NEXT_BASE_PATH='/terrywell'; $env:NEXT_DIST_DIR='.next-pages'
npx next build
npx next start -p 3200        # 다른 창에서 켜 둔 채로
python scripts/export_pages.py   # .pages-out/ 생성 → gh-pages 브랜치로 push
```

## 7. 폴더 구조

```
src/app/(site)/        사용자 페이지 (메인, 회사 소개, 제품, 장바구니, 주문, 마이페이지 …)
src/app/editor/        라벨 에디터 페이지와 저장 액션
src/app/admin/         관리자 페이지
src/app/api/           파일 내려받기, AI 생성
src/components/editor/ 에디터 (Fabric 캔버스, 툴바, 패널, 미리보기)
src/lib/db/            로컬/Supabase 공용 저장소, 타입, 예시 데이터
src/lib/               인증, 가격, 장바구니, 결제, 저장소, AI
src/content/images.ts  사이트 이미지 경로 (한 곳에서 관리)
supabase/migrations/   DB 스키마
public/images/         사이트 이미지 (고객 원본에서 시안 구도로 자른 것)
assets/                고객 원본 사진 (용량이 커서 git 제외)
```

## 8. 이미지 교체

- 사이트 문구·이미지(메인 히어로, 카드, 배너, 회사 소개, 커스텀 라벨)는 **관리자 → 사이트 설정**에서 바꾼다.
- 제품 사진·색상별 목업·라벨 부착 위치는 **관리자 → 제품 관리**에서 바꾼다.
- 로고는 시안에서 잘라낸 임시 파일(`public/images/draft/logo-footer.png`)이다. 원본 로고 파일을 받으면 교체한다.
