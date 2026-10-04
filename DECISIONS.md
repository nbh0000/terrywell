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
