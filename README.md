# TERRYWELL (terrywell.kr)

커스텀 라벨 수건 쇼핑몰. 웹 라벨 에디터(AI 이미지 생성 포함), 제품·장바구니·결제, 관리자 페이지.

- 명세: `CLAUDE.md` · 결정 사항: `DECISIONS.md` · 시안: `reference/`
- 화면: Next.js 16 (App Router, 정적 내보내기) · TypeScript · Tailwind CSS 4 · Fabric.js 7
- 서버: PHP 8 + MariaDB (`php/api`) — 카페24 뉴아우토반 호스팅. 결제 포트원 V2, 간편 로그인(카카오·네이버·구글)

> 2026-10-20 부터 Vercel + Supabase 대신 **카페24 뉴아우토반(PHP)** 에 올린다 (`DECISIONS.md` 참고).
> 화면은 정적 HTML·JS 이고, 데이터·인증·파일 저장·결제 검증·AI 호출은 모두 `php/api` 가 맡는다.

---

## 1. 구조

```
src/                   Next.js 화면 (정적 내보내기). 서버 컴포넌트 없음 → 각 화면은 *Client.tsx 가 브라우저에서 데이터를 받는다
  lib/db/http.ts       브라우저용 저장소: POST /api/db (표·조건·정렬). 공개 표는 HTML 에 함께 온 스냅샷(window.__TW__)으로 즉시 그린다
  lib/auth.ts          세션(/api/auth/session)·로그인·가입·비밀번호
  lib/page.tsx         usePageData(로더)·useRouteId(주소 마지막 조각)·useQuery·go()
php/                   카페24에 그대로 올라가는 서버 코드
  .htaccess            /api → api/index.php, 그 외 주소 → _page.php, https/www 정리, 비공개 폴더 차단
  _page.php            주소에 맞는 빌드 HTML 을 고르고(동적 주소는 __live.html), 로그인 상태·공개 데이터를 <head> 에 넣는다
  api/index.php        라우터. 인증, 범용 저장소(db), 디자인 저장, 주문·결제, AI, 견적·1:1 문의, 업로드, 파일 내려주기
  api/_lib/tables.php  표 정의(= src/lib/db/types.ts). 스키마·JSON 변환의 단일 기준
  api/_lib/dbapi.php   범용 저장소 + 접근 규칙(access_rules: public/own/admin)
  api/config.php       로컬 설정(git 제외). 실서버는 deploy.py 가 secrets.txt 로 만든다
  uploads/             공개 파일 (제품 사진·목업·스티커·글꼴·AI 이미지) — /uploads/<bucket>/…
  _storage/            비공개 파일 (디자인 인쇄 파일·첨부) — /api/files/<bucket>/… 로 권한 확인 후 내려준다
cafe24/
  build.py             정적 빌드 + php/ 를 cafe24/build/www 로 모은다
  deploy.py            FTP 배포 (preflight → backend → site → check)
  make_data_sql.php    .data/db.json → data.sql (카탈로그·콘텐츠)
  install.php          1회용 설치 도구 (테이블·데이터·관리자 계정)
  verify/smoke.py      Playwright 로 모든 화면·로그인·관리자 확인
  secrets.txt          FTP·DB·관리자·API 키 (git 제외)
```

---

## 2. 로컬에서 실행

필요한 것: Node, 포터블 Apache+PHP 8.4 (`C:\Users\pc\.itdam-php`), 포터블 MariaDB (`C:\Users\pc\.terrywell-db`, 포트 3309).

```bash
# 1) DB (창을 열어 둔다)
C:/Users/pc/.itdam-db/mariadb-11.4.5-winx64/bin/mariadbd.exe --defaults-file=C:/Users/pc/.terrywell-db/data/my.ini --port=3309 --console
# 처음 한 번: 스키마·데이터
C:/Users/pc/.itdam-php/php/php.exe -r 'require "php/api/_lib/core.php"; require "php/api/_lib/tables.php"; file_put_contents("cafe24/schema.sql", schema_sql());'
mariadb -P 3309 -h 127.0.0.1 -u root terrywell < cafe24/schema.sql
C:/Users/pc/.itdam-php/php/php.exe cafe24/make_data_sql.php --local && mariadb -P 3309 -h 127.0.0.1 -u root terrywell < cafe24/build/data.sql

# 2) PHP API (8090, DOCROOT=php/)
C:/Users/pc/.itdam-php/Apache24/bin/httpd.exe -f C:/Users/pc/.terrywell-php/terrywell-httpd.conf

# 3) 화면 개발 서버 (/api 등은 8090 으로 넘어간다)
npm install && npm run dev      # http://localhost:3000
```

- 관리자 계정(로컬): `.data/admin-login.txt` 의 이메일·비밀번호 (make_data_sql --local 이 같은 비밀번호로 만든다)
- 간편 로그인(로컬): `php/api/config.php` 의 `oauth_fake => true` 면 제공자 없이 가짜 회원으로 로그인된다
- 결제: 포트원 키가 없으면 사이트 안의 **테스트 결제**. AI: `ai_provider => 'mock'` 이면 비용 없는 목업 이미지

**정적 빌드 그대로 확인 (실서버와 같은 구조, 8091)**

```bash
python cafe24/build.py                 # 빌드 + cafe24/build/www
C:/Users/pc/.itdam-php/Apache24/bin/httpd.exe -f C:/Users/pc/.terrywell-php/terrywell-www-httpd.conf
python cafe24/verify/smoke.py          # 모든 화면·로그인·관리자 확인
```

---

## 3. 카페24 배포

접속 정보·키는 `cafe24/secrets.txt` (FTP/DB 비밀번호, 관리자 계정, 간편 로그인·AI·포트원 키, 알림 메일).

```bash
python cafe24/deploy.py preflight   # 서버 설정 확인 (재작성·PHP 확장·업로드 한도)
python cafe24/deploy.py backend     # PHP + config.php 업로드, 테이블·기본 데이터·관리자 계정 생성
python cafe24/deploy.py site        # 정적 빌드(실서버 주소) → 전체 업로드
python cafe24/deploy.py check       # /api/health 와 화면 확인
```

이후 수정은 `site` (PHP 를 고쳤으면 `php` 도). 서버의 `uploads/`, `_storage/`, `api/config.php` 는 건드리지 않는다.
키를 바꿨으면 `secrets.txt` 를 고치고 `backend` 를 다시 실행한다 (config.php 만 다시 만든다).

**도메인·https**: Cloudflare(무료)를 앞에 두고 SSL 모드 Flexible. 가비아 네임서버를 Cloudflare 로 바꾸고, A `terrywell.kr → 222.122.39.70`(프록시), CNAME `www → terrywell.kr`.
네임서버 전환 전에는 `http://terrywell.cafe24.com` 으로 확인한다.

**간편 로그인 콜백 주소** (각 개발자 콘솔에 등록): `https://terrywell.kr/auth/callback/kakao` · `/naver` · `/google`

---

## 4. 바뀌는 데이터·파일

- DB 표: `php/api/_lib/tables.php` 와 `src/lib/db/types.ts` 를 함께 고친다. 새 열은 `ALTER TABLE` 로 서버에 반영한다 (install 은 CREATE IF NOT EXISTS 만 한다).
- 사이트 설정·콘텐츠 기본값: `src/lib/site.ts` (배송비·AI 기본값은 `php/api/_lib/settings.php` 도 같게)
- 이미지 교체: `public/images/site`, `public/images/products` (`src/content/images.ts` 가 경로를 모은다). 로고는 시안에서 잘라낸 임시 파일이라 원본을 받으면 교체한다.
- 디자인 저장 파일: 300dpi PNG + PDF(실제 mm) + CMYK TIFF(ICC 없는 단순 변환) — `php/api/_lib/designs.php`
