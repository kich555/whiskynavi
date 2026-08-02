# 사업자 픽업 예약 관리 — `/business/pickup-reservations/*`

사업자 화면. 위스키 병 픽업 예약 공고와 접수 신청을 사업자가 확인·처리. 공고별 신청 현황 조회, 건별 상태 전이(결제완료→픽업대기→수령완료), 공고 단위 일괄 픽업대기 처리, 배송 정보 확인, 공고 내용 열람이 핵심. 관리자(`/admin/reservations`)와 달리 공고 등록/수정/삭제 권한은 없고 읽기 + 상태 전이만 수행.

## 라우트 맵

| 경로 | 유형 | 비고 |
|---|---|---|
| `/business/pickup-reservations` | 공고 목록 | 공고별 요약 + 일괄 픽업대기 |
| `/business/pickup-reservations/applications` | 신청 전체 목록 | 공고 경계 없는 평탄한 목록 + 검색 |
| `/business/pickup-reservations/[applicationId]` | 신청 상세 | 단일 신청 정보 + 상태 전이 |
| `/business/pickup-reservations/notices/[noticeId]` | 공고별 신청 관리 ★ | 이 화면군 핵심 — 배송정보 + 신청 테이블 + 일괄/선택 처리 |
| `/business/pickup-reservations/notices/[noticeId]/detail` | 공고 내용 열람 | 읽기 전용 — 사업자 접근 맥락 표시 |

## 공용 컴포넌트

이 화면군 전반에 쓰이는 공용 UI. 동작 방식 명시.

| 컴포넌트 | 출처 | 역할 | 동작 |
|---|---|---|---|
| `BusinessHeader` | `business/_components/` (공용) | 상단 타이틀 바 | sticky 헤더, 타이틀만 표시. 사이드바/검색 없음 (admin AdminHeader와 대비) |
| `Pagination` | `admin/_components/` (공용) | URL 기반 페이지네이션 | `router.push(basePath?page=&limit=&...)`. 북마크/공유 가능 |
| `FilterHeader` | `admin/_components/` (공용) | 테이블 헤더 내 필터 드롭다운 | `useTableFilter` 기반, URL searchParams 동기화 |
| `useTableFilter` | `admin/_components/` (공용) | 테이블 필터 상태 관리 | URL searchParams 동기화, 새로고침 유지 |
| `RelatedNoticeDetail` | `components/reservation/` (공용) | 공고 내용 읽기 전용 렌더 | 사업자/사용자 화면 양쪽에서 재사용. appearance 토글(dark/light) |
| `StatusActionButton` | 각 페이지 내부 (반복 정의) | 단일 신청 상태 전이 버튼 + 확인 Dialog | 상태에 따라 버튼 종류 결정, Dialog 확인 후 Server Action → `router.refresh()` |

**"목록으로 돌아가기" 버튼 패턴**: 상세·공고별 관리 페이지 상단. `router.back()` 사용 — 브라우저 히스토리 기반이라 직접 진입 시엔 이전 페이지가 없을 수 있음. 공고 내용(detail) 페이지만 예외로 `Link` 기반 명시적 href 이동(`router.back()` 아님) — businessId 보존한 쿼리스트링 포함.

## 도메인 개념

### 신청 상태 전이 (사업자가 처리 가능한 구간만)

```
확정(CONFIRMED) →결제완료 처리→ 결제완료(PAYMENT_COMPLETED) →픽업대기 처리→ 픽업대기(WAITING_PICKUP) →수령완료 처리→ 수령완료(RECEIVED)
```

- **사업자가 처리하지 않는 상태**: 신청완료(APPLIED)→확정, 거절, 취소는 관리자 영역. 사업자 화면엔 해당 액션 버튼 없음.
- **상태별 활성 버튼 매핑** (`STATUS_TO_ACTION`):
  - `CONFIRMED` → "결제완료 처리" (cyan)
  - `PAYMENT_COMPLETED` → "픽업대기 처리" (amber)
  - `WAITING_PICKUP` → "수령완료 처리" (emerald)
  - 그 외 상태(신청완료/수령완료/취소/거절) → 버튼 미표시
- 모든 상태 전이는 확인 Dialog 거친 후 Server Action → 성공 시 `router.refresh()`

### businessId 쿼리 파라미터

모든 라우트가 `?businessId=` 쿼리 파라미터를 선택적으로 받음. 다중 사업장 사업자가 특정 사업장 스코프로 조회할 때 사용. 페이지 간 이동 시 `withBusinessId()` 헬퍼로 보존. 유효하지 않은 정수면 `notFound()`.

## 페이지별 맥락

### /business/pickup-reservations — 공고 목록

사업자가 관련된 픽업 예약 공고를 공고 단위로 조회. 공고별 신청/요청/확정 수량 요약, 배송 송장번호, 일괄 픽업대기 처리 진입점.

**공고 테이블** (행의 공고명 클릭 = `router.push('/business/pickup-reservations/notices/[noticeId]')`):

| 공고 | 공고상태 | 단가 | 신청 | 요청 | 확정 | 송장번호 | 관리 |
|------|----------|------|------|------|------|----------|------|
| 스프링 세일 / 글렌피딕 18 (공고 #12, 병 #45) | 공고 진행중 | ₩180,000 | 35건 | 50병 | 35병 | 1234567890 | [공고 내용][신청 관리][공고 일괄 픽업대기] |
| 겨울 한정판 / 맥콜 12 (공고 #11) | 공고 종료 | ₩95,000 | 50건 | 50병 | 50병 | 해당 없음 (용달) | [공고 내용][신청 관리] |

- **행 액션**(관리 열):
  - "공고 내용" → `/notices/[noticeId]/detail` (Link)
  - "신청 관리" → `/notices/[noticeId]` (Link)
  - "공고 일괄 픽업대기" → Dialog 확인 후 `bulkWaitingPickupAction`. **신청 0건이거나 bottleId 없으면 비활성화**
- **송장번호 표시**: 배송방식이 `PRIVATE_CARGO`(개인 용달)면 "해당 없음 (용달)", 택배면 송장번호. 배송 데이터는 `getOptionalData`로 실패 시 무시(undefined) — 페이지 깨짐 방지
- **공고명 표시 규칙** (`getReservationNoticeDisplay`): 공고명 우선, 없으면 병명, 없으면 "이름 없는 예약 공고". 병명이 공고명과 다르면 부제목으로 병명 표시
- **데이터 페칭**: 공고 상태 목록과 배송 목록을 `Promise.all` 병렬. 배송은 `getOptionalData`로 실패 시 undefined

### /business/pickup-reservations/applications — 신청 전체 목록

공고 경계 없이 사업자 관련 신청 전체를 평탄한 목록으로. 검색과 상태 필터 제공. 공고별 관리 화면과 달리 배송정보·일괄 처리 없음 — 건별 조회/상태 전이 중심.

**검색**: 검색 타입(실명/별명/전화번호) 선택 + 키워드 입력. 검색 시 `page=1`로 리셋. 검색어 지우기(X) 버튼으로 초기화. 검색어는 `q`, 타입은 `searchType` 파라미터.

**신청 테이블**:

| ID | 공고 ID | 공고 | 신청자 | 신청수량 | 확정수량 | 단가 | 총액 | 상태 | 신청일 | 관리 |
|----|---------|------|--------|----------|----------|------|------|------|--------|------|
| 301 | 12 | 스프링 세일 / 글렌피딕 18 | 실명: 홍길동 / 별명: 길동 / 전화: 010-1234 | 2 | 2 | ₩180,000 | ₩360,000 | 확정 | 2026.03.05 | [결제완료 처리][👁][공고 내용] |
| 302 | 11 | 겨울 한정판 | 실명: 김사장 / 별명: - / 전화: 010-5678 | 5 | 5 | ₩95,000 | ₩475,000 | 픽업대기 | 2026.03.04 | [수령완료 처리][👁] |

- **상태 필터**: 테이블 헤더의 `FilterHeader` 드롭다운 — 전체/신청완료/확정/결제완료/픽업대기/수령완료/취소/거절. URL 기반
- **건별 액션**(관리 열):
  - 상태 전이 버튼 (상태에 따라 자동 결정, 없으면 미표시)
  - 상세 아이콘(👁) → `/business/pickup-reservations/[applicationId]` (`router.push`)
  - "공고 내용" 링크 → `/notices/[noticeId]/detail` (noticeId 있을 때만)
- **상단 액션**: 검색 폼만, 별도 생성 버튼 없음 (사업자는 공고 등록 불가)

### /business/pickup-reservations/[applicationId] — 신청 상세

단일 신청 건의 전체 정보를 카드 형태로 표시 + 상태 전이. 공고/병 정보, 신청 정보, 신청자 정보 3개 섹션.

**상단 액션바**:
- "픽업 예약 목록으로 돌아가기" → `router.back()` ⚠️ 공용 패턴
- "공고 내용 보기" → `/notices/[noticeId]/detail` (Link, noticeId 있을 때만)
- 상태 전이 버튼 (상태에 따라 자동 결정)

**섹션 구성**:
1. **공고 및 병 정보** — 병 이미지, 신청 ID, 공고 ID, 공고명, 병명, 병 ID
2. **신청 정보** — 상태 배지, 신청수량, 확정수량, 단가, 총액, 신청일, 수정일
3. **신청자 정보** — 이름, 닉네임, 이메일, 전화번호

- **404 처리**: API가 404 반환 시 `notFound()` — 존재하지 않는 신청 ID 직접 접근 차단
- 상태 전이 성공 시 `router.refresh()`로 현재 페이지 갱신 (이동 아님)

### /business/pickup-reservations/notices/[noticeId] — 공고별 신청 관리 ★

공고 1건에 접수된 신청 전체를 한 화면에서 관리. 이 화면군의 핵심 — 배송정보, 신청 테이블, 일괄/선택 픽업대기 처리, 건별 상태 전이 모두 제공.

**상단 액션바**:
- "공고 목록으로 돌아가기" → `router.back()` ⚠️ 공용 패턴
- "공고 내용 보기" → `/notices/[noticeId]/detail` (Link)
- "공고 일괄 픽업대기" → Dialog. **신청 0건이거나 bottleId 없으면 비활성화**. 공고의 결제완료 신청 전체를 픽업대기로
- "선택 일괄 픽업대기 (N건)" → 체크박스로 선택한 신청만. **선택된 게 없으면 버튼 미표시** (`selectedIds.size > 0`일 때만 노출)

**배송정보 섹션** (테이블 상단):

| 배송 방식 | 택배사 | 송장번호 | 배송 진행 | 메모 |
|-----------|--------|----------|-----------|------|
| 택배 | CJ대한통운 | 1234567890 | 배송 완료 | 문앞 보관 |
| 개인 용달 | 해당 없음 (용달) | 해당 없음 (용달) | 발송 완료 | - |

- 배송방식: `PARCEL`(택배) / `PRIVATE_CARGO`(개인 용달). 용달은 택배사/송장번호 "해당 없음 (용달)" 처리
- 배송 데이터는 `getOptionalData`로 실패 시 무시 — 빈 배열이면 "등록된 배송정보가 없습니다" 표시

**신청 테이블** (체크박스 열 포함):

| ☐ | 신청 ID | 신청자 | 신청수량 | 확정수량 | 단가 | 총액 | 상태 | 신청일 | 처리 |
|---|---------|--------|----------|----------|------|------|------|--------|------|
| ☐ | 301 | 홍길동 / 010-1234 | 2 | 2 | ₩180,000 | ₩360,000 | 결제완료 | 2026.03.05 | [픽업대기 처리][👁] |
| - | 302 | 김사장 / 010-5678 | 5 | 5 | ₩95,000 | ₩475,000 | 수령완료 | 2026.03.04 | [👁] |

- **체크박스**: `PAYMENT_COMPLETED` 상태인 신청만 체크 가능 (픽업대기 일괄 처리 대상이므로). 전체 선택 체크박스는 결제완료 신청이 없으면 비활성화
- **상태 필터**: 테이블 헤더 드롭다운. URL 기반
- **건별 액션**(처리 열): 상태 전이 버튼 + 상세 아이콘(👁) → `/business/pickup-reservations/[applicationId]`
- **하단 안내**: 확정→결제완료, 결제완료→픽업대기, 픽업대기→수령완료 가능 안내 아이콘 행
- **데이터 페칭**: 신청 목록 / 배송 / 공고 상세를 `Promise.all` 병렬. 공고·배송은 `getOptionalData`로 실패 시 undefined

### /business/pickup-reservations/notices/[noticeId]/detail — 공고 내용 열람 (읽기 전용) ⚠️ 특수

**목적**: 사업자가 공고 내용(상세 설명, 이미지, 예약 기간, 가격, 수량 한도, 역할별 접근 정보)을 읽기 전용으로 열람. 사업자는 공고를 수정할 권한이 없으므로 내용만 표시.

**특수 동작**:
- **접근 맥락 표시**: `accessReason`에 따라 "픽업 사업장 관계로 열람 중" 또는 "과거 신청 관계로 열람 중" 배너 표시 — 사업자가 왜 이 공고를 볼 수 있는지 명시
- **공급가 노출**: `showSupplyPrice` 옵션 켜서 공급가(supplyPrice)까지 표시 — 사업자 화면 특화
- **appearance="light"**: 사용자 화면(dark)과 대비되는 라이트 테마
- **"공고별 신청 관리로 돌아가기"**: `Link` 기반 명시적 href 이동 (`router.back()` 아님). businessId 보존한 쿼리스트링 포함. 직접 진입해도 안전
- **404 처리**: API 404 시 `notFound()`. token/noticeId 파싱 실패 시에도 `notFound()`
- `RelatedNoticeDetail` 공용 컴포넌트 재사용 — 사용자 예약 화면과 컴포넌트 공유, appearance만 다르게

## 데이터 흐름 (개요)

- 모든 페이지 RSC. `getAuthToken()` + `withToken()` 인증.
- 상세/공고별 관리는 `Promise.all`로 관련 데이터 병렬 페칭.
- 배송/공고 상세 등 보조 데이터는 `getOptionalData` 헬퍼로 실패 시 undefined 처리 — 페이지 깨짐 방지.
- 상태 전이(결제완료/픽업대기/수령완료)는 Server Action → Orval API → `revalidatePath`로 목록/상세 갱신.
- 일괄 픽업대기: 공고 단위(`bottleId`+`noticeId`) 또는 선택 신청(`applicationIds[]`) 두 가지 모드.
- 필터/페이지네이션/검색은 URL searchParams 기반 — 북마크/공유 가능.
- businessId 쿼리 파라미터는 모든 라우트에서 선택적 스코프 필터.

## 외부 의존

- **인증**: NextAuth (business 접근 권한)
- **API**: 원격 백엔드 `api.whiskynavi.com` (Orval 코드젠 클라이언트, `users/businesses/pickup-reservations` 엔드포인트군)
- **상태 전이 API**: 결제완료 / 픽업대기 / 수령완료 / 일괄 픽업대기 — 사업자 권한으로 처리 가능한 구간만
- **공고 내용**: `RelatedNoticeDetail` 공용 컴포넌트 — 사용자 예약 화면과 공유

## 참고

- 구현 계획서: `docs/superpowers/plans/2026-04-26-pickup-reservations-pages.md`
- 관리자 예약 관리(대비): [admin/reservations.md](../admin/reservations.md) — 공고 등록/수정/삭제 권한 있음
- 코드 구조 탐색: `graphify query "business pickup-reservations"`
