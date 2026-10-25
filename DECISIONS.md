# 결정 사항 기록

명세(CLAUDE.md)에서 애매했던 부분을 사용자와 정한 내용. 날짜는 결정한 날.

## 2026-10-04
1. **라벨 기본값**: 재단 65×45mm(가로형), 도련 2mm, 안전 여백 3mm. 제품별로 관리자에서 변경 (하드코딩 금지 원칙 유지 — 이 값은 시드 데이터의 기본값일 뿐).
2. **메인 카드 연결**
   - Collection(제품) → `/products`
   - Custom(커스텀 라벨) → `/custom-label`
   - Quality(원단·인증·제작방식) → `/about#quality`
   - Journal(브랜드 소식·스타일링) → `/notices`
3. **에디터 툴바에 "사진틀" 추가** (레퍼런스에 있음): `크기 · 페이지 · 사진 · 사진틀 · 텍스트 · 디자인 · AI · 스티커 · 배경`
4. **인쇄 파일**: 300dpi PNG + PDF + CMYK 변환본 모두 생성.

## 기술 결정
- Docker가 없어 Supabase 로컬 실행 불가 → `NEXT_PUBLIC_SUPABASE_URL` 이 없으면 **로컬 모드**로 동작
  (`.data/db.json` 파일 DB + 개발용 로그인). 키를 넣으면 같은 코드가 Supabase를 사용한다.
- 레퍼런스 파일명 주의: `02_label-editor.jpg` 의 실제 내용은 제품 상세, `03_product-detail.jpg` 가 에디터.

## 2026-10-04 (2)
- 사용자가 준 원본 시안(가로 18,533px, CMYK Japan Color 2001)을 `reference/original/` 에 두고, sRGB 로 변환해 이미지·색을 다시 뽑았다.
  zip 의 `reference/*.jpg`(가로 8,000px)는 색 변환 없이 줄인 것이라 색이 다르다 → 색·이미지는 original 기준.
- 사이트 색: 글자·버튼 #241a18, 바탕 #f7f7f7, 로고 파랑 #4c78bb.

## 2026-10-04 (3) 진행 메모
- 사진: 고객 원본(assets/website)을 시안 구도로 잘라 public/images/site 에 둠. 로고는 원본 파일이 없어 시안에서 자른 임시본.
- 결제: 포트원 키가 없으면 사이트 안 테스트 결제(mock). 키가 있으면 결제 조회 API 로 금액 검증 후 결제완료.
- AI: AI_PROVIDER=mock 기본. 실제 호출(openai/google)은 키를 넣고 사용자 확인 후 테스트.
- 이용약관·개인정보처리방침: 사이트 기능 기준 초안 — 고객사 확인 필요 (관리자 > 사이트 설정에서 수정).
- 배포 시 주의: Vercel 요청 본문 4.5MB 제한 → 큰 PDF 업로드·사진이 많은 디자인 저장은 Supabase Storage 직접 업로드로 바꿔야 함.

## 2026-10-12 고객 수정 요청 ([테리웰] 웹사이트 수정사항.hwp) 반영
- 메인: 카드 4개 삭제. 히어로(TERRYWELL)와 신제품 배너(Lollipop)를 자동으로 넘어가는 슬라이드로 합침(누르면 해당 주소로).
  슬라이드는 관리자 > 사이트 설정에서 추가·순서·기간(시작일/종료일, 한국 날짜)·링크를 정한다. 아래에 제품 바로가기(색상별), 그 아래 BRAND 이미지(마우스 올리면 어두워지며 BRAND → 회사 소개).
- 회사 소개: 시안 두 가지 중 흰 바탕형 선택. 로고 선이 그려지는 애니메이션(로고 PNG 를 따라 그린 3획 SVG) + 브랜드 문구, 본문은 고객 문구로 교체.
- 페이지 바탕 #ffffff, 제품 사진 칸 #f4f4f2 (예시보다 밝게).
- 제품 목록 탭: 정적 미리보기(GitHub Pages)에서 ?tab= 이 안 먹던 문제 → 화면에서 바로 거르도록 변경. NEW 는 카테고리가 아니라 출시일(released_at)부터 N일(기본 90일, 사이트 설정) 자동 표시.
- 제품: 새 풀샷(라벨 빈칸)으로 교체, 세로 사진을 시계 방향으로 돌려 라벨이 오른쪽 아래. 상세 이미지 3장 교체. PDF 업로드 제거(에디터 파일 불러오기로 대체), 단가표 버튼 제거, 이름에 '5P 세트', 수량 5개 단위(qty_step, 서버에서도 맞춤). 혼합(mix) 색상 추가 + 안내 문구.
- 라벨 크기: 고객 확인 결과 요청서대로 재단 68×48mm. 도련 1.5, 안전 여백 3.5mm → 작업 71×51mm, 안전 영역 61×41mm.
  (처음엔 가이드 그림 기준 재단 65×45 로 했다가 2026-10-12 고객 지시로 변경)
- 에디터: 레퍼런스(실제 업체) 느낌의 검은 상단 바·빨간 버튼을 흰 바·로고 파랑으로 변경. 파일 불러오기(JPG·PNG·WEBP·GIF·SVG·PDF·AI(PDF 호환)), 카메라 촬영, QR·바코드(qrcode/jsbarcode, 외부 호출 없음), 임시저장 추가. EPS 는 브라우저에서 못 읽어 PDF 로 저장 안내.
- 하단: 통신판매업번호 비우면 숨김, 주소 변경, 1:1 문의 버튼, 인스타그램 아이콘, 로고 → 처음 화면, 위로 가기 버튼.
- 견적문의 → Q&A(고객센터): 자주 묻는 질문(분류·검색) / 1:1 문의(유형·주문번호·제목·내용·첨부, 관리자 답변) / 견적 문의(제품은 롤리팝만) / 공지사항.
  1:1 문의 AI 챗봇은 비용이 드는 API 호출이라 보류. 대신 문의 유형을 고르면 관련 자주 묻는 질문을 먼저 보여 준다.
- 로그인: 간편 로그인 버튼(카카오·네이버·구글·애플). Supabase OAuth 로 카카오·구글·애플 연결 준비(NEXT_PUBLIC_OAUTH_PROVIDERS), 네이버는 별도 연동 필요. 키 전에는 '준비 중' 안내.
  비회원 주문 조회(주문번호 + 받는 분 연락처). 비회원 주문(게스트 결제) 자체는 아직 없음.
- 마이페이지: 주문별 견적서·거래명세서 출력(/print/orders/[id]), 1:1 문의 탭.
- DB: supabase/migrations/0002_feedback_2026_10.sql (qty_step, released_at, is_mix, faqs, inquiries). 로컬 DB 는 scripts/migrate-local-2026-10.ts 로 반영.
- (같은 날 추가) 에디터 화면 구조 변경: 레퍼런스(실제 업체)의 '아래 아이콘 줄 + 바텀시트' 대신 PC 는 왼쪽 도구 막대 + 왼쪽 패널, 캔버스 위 떠 있는 선택 도구 막대, 오른쪽 완성 미리보기. 상단에 단계(라벨 디자인 → 저장 → 주문). 모바일은 아래 도구 줄 유지(화면 폭 때문).
- 글꼴 추가: 관리자 > 글꼴에서 WOFF2·WOFF·TTF·OTF 를 올리면 에디터 글꼴 목록에 추가 (site_contents.fonts). 상업용 사용 가능 글꼴만.
- 마이페이지 '거래내역 출력' 탭 추가. 메인 슬라이드 좌우 화살표 + 끌어서 넘기기, 제품 바로가기 카드마다 [바로가기] 버튼.

## 2026-10-20 고객 2차 회신 (카카오·구글 키 전달, 네이버 콜백 주소 문의)
- 간편 로그인은 Supabase OAuth 를 쓰지 않고 **사이트가 직접 OAuth 처리** (`/auth/oauth/{p}` → 제공자 → `/auth/callback/{p}`).
  이유: 네이버는 Supabase 미지원이고, Supabase 프로젝트가 아직 없어 콜백 주소를 못 알려 주던 문제를 없앰. 로컬 모드·Supabase 모드 모두 동작.
  Supabase 모드는 service role 로 회원을 만들고 매직링크 토큰을 서버에서 검증해 세션을 만든다.
- 콘솔에 등록할 주소: `https://terrywell.kr/auth/callback/kakao` · `/naver` · `/google` (www 도 쓰면 둘 다 등록). 네이버 서비스 URL 은 `https://terrywell.kr`.
- 키는 `.env.local` 의 KAKAO_/NAVER_/GOOGLE_CLIENT_ID·SECRET. 카카오·구글 키는 2026-10-20 고객이 메일로 전달 (저장소에는 넣지 않음). 네이버는 고객이 앱 등록 후 전달 예정. 애플은 보류.
- 이메일 미동의(카카오) 회원은 `{provider}.{id}@sns.terrywell.kr` 내부 주소로 가입. 같은 이메일의 기존 계정이 있으면 그 계정으로 로그인.
- `OAUTH_FAKE=1` (개발 전용) 이면 제공자 없이 가짜 회원으로 흐름 확인 가능.
- 고객 질문 답: PC 에디터도 PNG·JPG 가능(사진 > 이미지 불러오기/파일 불러오기, 이미 구현). 라벨 크기 변경은 관리자 > 제품 > '라벨 설정 (mm)'.
  결제는 현재 로그인 필수(비회원 결제 없음, 비회원은 주문 조회만) — 비회원 결제는 고객이 원하면 추가.
- 새 제품 기본 라벨값을 68×48·도련 1.5·안전 3.5 로 맞춤 (관리자 폼 기본값).

## 2026-10-20 (2) 호스팅: Vercel+Supabase → 카페24 뉴아우토반(PHP)
- 사용자 결정. 고객이 카페24 뉴아우토반 비즈니스(아이디 terrywell, 서버 222.122.39.70, PHP 8.4, MariaDB 10, 일 트래픽 10GB) 결제. Node VPS 를 권했지만 뉴아우토반으로 확정.
- 구조: 잇담과 같은 "Next 정적 내보내기 + PHP API". 서버 컴포넌트·서버 액션·API 라우트를 모두 없애고, 화면은 브라우저에서 `/api/db`(범용 저장소, 서버가 public/own/admin 규칙으로 권한 강제)와 전용 API(인증·디자인 저장·주문·AI·문의·업로드)를 부른다.
- 동적 주소(`/products/{slug}` 등)는 `__live.html` 한 장을 빌드하고 `_page.php` 가 골라 준다. 화면은 주소에서 값을 읽는다 (`useRouteId`).
- 첫 화면 속도: `_page.php` 가 로그인 상태와 공개 표(제품·설정·FAQ 등)를 `window.__TW__` 로 HTML 에 넣어 요청 없이 그린다.
- 인증: PHP 서명 쿠키(`tw_session`), 비밀번호 bcrypt. 비밀번호 재설정은 PHP mail(). 간편 로그인은 PHP 가 처리 (`/auth/oauth/{p}` → `/auth/callback/{p}`, .htaccess 가 api 로 보냄). 콜백 주소는 바뀌지 않음.
- 인쇄 파일: sharp·pdf-lib 대신 GD + 순수 PHP. PNG 에 pHYs(300dpi), PDF 는 raw RGB Flate 이미지 한 장(실제 mm), CMYK TIFF 는 **ICC 프로필 없는 단순 변환**(서버에 Imagick 없음). PIL 로 CMYK·300dpi 확인됨.
- AI: 기본 모델 교체 — OpenAI gpt-image-1.5(중간 품질 1536×1024), Google gemini-nano-banana-2.1(generateContent, 4:3). imagen-4 는 2026-08-17 종료.
- 저장소: 공개 파일 `www/uploads/<bucket>`, 비공개 `www/_storage/<bucket>`(.htaccess 로 차단, `/api/files` 가 권한 확인 후 내려줌). 로컬 파일 DB(.data/db.json)는 `cafe24/make_data_sql.php` 로 MariaDB 에 옮김. Supabase 코드·마이그레이션·GitHub Pages 미리보기 스크립트 삭제.
- https: Cloudflare Flexible. .htaccess 의 https 강제는 Cloudflare 뒤에서 http 로 들어온 경우(CF-Visitor)에만 (네임서버 전환 전 http 접속이 막히지 않게).
- 삭제 보호: 주문에 쓰인 디자인은 서버가 삭제를 거부. 숨긴 제품·템플릿·FAQ 는 비관리자에게 안 보임(서버 필터).
- 로컬 환경: Apache 8090(DOCROOT=php/, 개발 API) · 8091(DOCROOT=cafe24/build/www, 실서버 구조 확인) · MariaDB 3309. Playwright `cafe24/verify/smoke.py` 로 53개 화면·로그인·클라이언트 이동·관리자 확인.

## 2026-10-23 고객 3차 회신 (네이버 키·Gemini 키, AI 채팅식 요청)
- 네이버 간편 로그인 키 반영 (secrets.txt → config.php). 운영에서 카카오·네이버·구글 모두 각 사 로그인 화면까지 확인. 구글은 앱 게시 전이라 테스트 사용자만 로그인 가능.
- AI: 고객이 "GPT처럼 글 + 이미지 둘 다" 선택 → 에디터 AI 패널을 채팅식으로 변경. 글 + 참고 사진(최대 3장, 1536px 로 줄여 보냄) + 이전 결과 "이어서 고치기"(본인 ai-images 만 허용). 보낼 때마다 생성 1회·이미지 1장(AI_IMAGES_PER_REQUEST=1, 고객 안내 "1건당 1생성"). 첨부 사진은 google(nano-banana) 만 쓰고 openai·mock 은 글만.
- 운영 AI_PROVIDER=google, 모델 gemini-nano-banana-2.1 (키로 모델 목록 조회해 존재 확인, 실제 생성 호출은 아직 안 함).
- 관리자 > 회원 관리에 삭제(탈퇴 처리) 추가: 로그인 계정·회원 정보·찜·장바구니·1:1 문의(첨부 포함)·AI 기록/이미지·주문에 안 쓰인 디자인 삭제. 주문과 주문에 쓰인 디자인은 전자상거래법 보관(5년) 때문에 남김. 관리자 계정은 삭제 불가.
- deploy.py 에 `config` 단계 추가 (키만 바뀌었을 때 config.php 만 올림). 운영 테스트 회원 test@terrywell.kr (비밀번호 secrets.txt TEST_PASSWORD).
- (2026-10-25) 운영에서 사진을 넣으면 오류: 카페24 가 큰 JSON 본문(약 200KB 이상)을 502 HTML 로 끊음 → AI 요청을 multipart(사진 image0~2 파일)로 변경. 2.4MB 사진 통과 확인.
- (2026-10-25) AI 대화 기록 유지: 요청 시작 때 ai_generations 에 생성 중(error='__pending__') 행을 넣고 끝나면 갱신, ignore_user_abort 로 화면을 떠나도 끝까지 생성. 패널은 `GET ai/history`(최근 30건, 참고사진·이어 고친 원본 포함)로 대화를 다시 그리고, 생성 중이면 4초마다 확인. 입력창 아래에 'AI 시안' 모음(누르면 라벨에 들어감).
- (2026-10-25) AI 지시문을 "라벨에 인쇄될 평면 그림만"으로 변경(수건·라벨 목업 사진 금지). AI 시안은 라벨 작업 크기를 꽉 채워 넣음. 운영 실생성 3회로 확인(글만 17초 / 사진 첨부 / 이어서 고치기).
- (2026-10-25) 동적 주소 화면 데이터(editor/x.txt, products/x.txt)가 404 → 클라이언트 이동 때마다 전체 새로고침되던 문제 수정(_page.php 가 __live.txt 로).
- (2026-10-25) Cloudflare 경유 요청의 약 10~30% 가 522(원서버 연결 시간 초과). 서버 직접은 100% 정상, 같은 계정의 squick.kr·인천도어락24 도 같은 증상 → 카페24↔Cloudflare(HKG) 연결 문제. 코드로 해결 불가: 카페24 에 Cloudflare IP 허용 문의 또는 원서버 SSL 설치 후 DNS only 전환 검토.
