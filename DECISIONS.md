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
