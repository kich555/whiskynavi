# 관리자 일반상품 관리 — `/admin/general-items/*`, `/admin/general-item-sales/*`

위스키 병이 아닌 **배송 주문용 일반상품**(잡상품)의 카탈로그와 판매공고를 관리자가 관리. 상품 등록 → 판매 공고 → (주문 접수·발송) 도메인 사이클 중 앞단 두 단계를 담당. 주문 관리는 [orders.md](./orders.md) 참조.

## 라우트 맵

| 경로 | 유형 | 비고 |
|---|---|---|
| `/admin/general-items` | 상품 목록 | |
| `/admin/general-items/new` | 상품 신규 등록 폼 | 등록 성공 시 판매공고 등록 유도 |
| `/admin/general-items/[itemId]` | 상품 상세(=수정 폼) | 상세 조회와 수정이 한 폼 |
| `/admin/general-item-sales` | 판매공고 목록 | 전체 풀스캔 기반 |
| `/admin/general-item-sales/new` | 판매공고 신규 등록 폼 | 상품 선택 시 값 자동 채움 |

> 주문 라우트(`/admin/general-item-orders/*`)는 [orders.md](./orders.md)에서 상세 서술. 일반상품 직배송 주문(`productType=ITEM`, `fulfillmentMethod=DIRECT_DELIVERY`, `saleTiming=IMMEDIATE`)으로 고정 조회하며 배송 CSV 워크플로우를 제공.

## 공용 컴포넌트 (admin/_components/)

이 화면군 전반에 쓰이는 공용 UI. 동작 방식 명시.

| 컴포넌트 | 역할 | 동작 |
|---|---|---|
| `AdminHeader` | 상단 헤더(타이틀, 사이드바 토글, 검색) | 사이드바 토글은 context. 상품 목록은 검색 활성화, 폼/상세·판매공고는 `showSearch=false` |
| `Pagination` | URL 기반 페이지네이션 | `router.push(basePath?page=&limit=&...)`. 북마크/공유 가능 |

**"목록으로 돌아가기" 버튼 패턴**: 상품 등록·상세, 판매공고 등록 폼 상단. `router.back()` 사용 — 브라우저 히스토리 기반이라 직접 진입 시엔 이전 페이지가 없을 수 있음. 안전한 이동 필요 시 `router.push('/admin/general-items')`로 대체 고려.

## 페이지별 맥락

### /admin/general-items — 상품 목록

**상품 테이블** (행 액션 = "상세조회" 링크 → `router.push('/admin/general-items/[id]')`):

| ID | 상품명 | 재고 | 소비자가 | 공급가 | 노출 | 수정일 | 관리 |
|----|--------|------|----------|--------|------|--------|------|
| 8 | 글래스 세트 | 120 | ₩35,000 | ₩22,000 | 노출 | 2026.07.21 | [상세조회] |
| 7 | 얼음볼 6종 | 0 | ₩18,000 | ₩11,000 | 숨김 | 2026.07.05 | [상세조회] |

- **행 액션**: 상세조회만 (삭제 버튼 없음 — 상품은 삭제 불가, 수정만 가능)
- **상단 액션**: "일반상품 등록" 버튼 → `router.push('/admin/general-items/new')`
- **검색**: 헤더 검색창 → `q` 파라미터, 페이지 1로 리셋
- **노출 배지**: `visible` 여부로 노출/숨김 표시. 신규 등록 폼의 `visible` hidden 기본값은 "on"(노출)
- **정렬**: 생성일 내림차순 고정

### /admin/general-items/new — 상품 신규 등록

상품명·설명·재고·소비자가·공급가·추가정보(JSON)·대표 이미지 입력. `visible`은 hidden 필드로 기본 노출.

**이미지 업로드**: 파일 선택 시 즉시 미리보기(`URL.createObjectURL`). 최대 5MB, 타입 검증. 제출 시 먼저 이미지 업로드 API(`ITEM` purpose) 호출 후 반환된 key와 함께 상품 생성.

**추가 정보 JSON**: 자유 형식 JSON(예: `{"details":{"material":"glass"}}`). 빈 값 허용, 파싱 실패 시 에러 메시지.

**등록 성공 플로우** ⚠️ 특수: 성공 시 곧바로 목록으로 가지 않고, 초록색 성공 박스에서 두 선택지 제공:
1. **"이 상품으로 일반상품판매공고 등록"** → `router.push('/admin/general-item-sales/new?productId=...&itemName=...&salePrice=...&totalQuantity=...)` — 생성된 상품의 ID·이름·소비자가·재고를 쿼리로 전달
2. **"목록 보기"** → `router.push('/admin/general-items')`

### /admin/general-items/[itemId] — 상품 상세(=수정 폼) ★

상세 조회와 수정이 **하나의 폼**으로 통합. 읽기 전용 상세가 아님 — 페이지 자체가 수정 폼이고 저장 버튼으로 즉시 수정.

- **"일반상품 목록으로 돌아가기"** → `router.back()` ⚠️ 공용 패턴
- 기존 상품 데이터로 폼 필드 채움. `extraInfos`는 JSON pretty-print로 직렬화하여 표시
- 이미지 미리보기는 기존 `imageUrl`로 초기화, 새 파일 선택 시 교체
- **수정 성공 시**: 초록색 인라인 메시지만 표시(목록으로 자동 이동 안 함). `revalidatePath`로 목록/상세 캐시 갱신
- **ID 검증**: itemId가 양의 정수가 아니면 RSC 단에서 `notFound()`

### /admin/general-item-sales — 판매공고 목록

**판매공고 테이블**:

| 공고 ID | 제목 | 상품 | 판매가 | 수량 | 상태 | 판매기간 | 확인 |
|---------|------|------|--------|------|------|----------|------|
| 15 | 여름 한정 패키지 | 글래스 세트 | ₩32,000 | 45 / 120 | 판매중 | 2026.07.01 00:00 ~ 2026.08.31 23:59 | [상품 화면] |
| 14 | 얼음볼 얼리치 세일 | 얼음볼 6종 | ₩15,000 | 0 / 50 | 품절 | 2026.06.01 ~ 2026.07.30 | [상품 화면] |

- **수량 열**: `판매가능수량 / 총판매수량` 표시
- **상태 배지**: 임시저장(회색) / 판매중(초록) / 판매종료(슬레이트) / 품절(빨강)
- **상태 필터**: 드롭다운으로 `saleStatus` 파라미터 필터링, 페이지 1 리셋. 검색바 없음(`showSearch=false`)
- **"확인" 링크**: `router.push('/general-items/[saleId]')` — ⚠️ **사용자 화면**(관리자 화면 아님). 관리자 판매공고 ID를 사용자 상품 라우트로 직접 연결
- 기본 페이지당 50건

**풀스캔 동작** ⚠️ 특수: 판매공고 API는 일반상품 전용 엔드포인트가 없음 — 전체 판매공고(`getApiAdminSales`)를 페이지당 100건씩 끝까지 순회 페칭한 뒤, `productType === "ITEM" && saleType === "GENERAL"`인 것만 클라이언트에서 필터링. 필터링된 전체 리스트에서 메모리 페이징. 공고 수가 늘면 RSC 페칭 비용이 선형 증가함.

### /admin/general-item-sales/new — 판매공고 신규 등록

**상품 선택 → 값 자동 채움** 특수 동작: 상품 드롭다운에서 일반상품 선택 시 해당 상품의 이름·소비자가·재고를 `itemName`·`salePrice`·`totalQuantity`에 자동 입력. 일반상품 등록 성공에서 쿼리로 넘어온 초기값도 동일하게 적용.

**입력 항목**: 판매 상품(선택)·공고 제목·주문 화면 상품명·판매가·총 판매 수량·판매 가능 수량(비우면 총 수량)·1회 최대 주문 수량·판매 상태·판매 시작/종료 시각.

**주문 가능 역할** ⚠️ 도메인: 우측 사이드 패널에서 주문 가능한 회원 역할 체크박스. 아무 역할도 선택하지 않으면 **비회원까지 주문 가능한 일반 판매**로 등록. 역할 옵션: 일반 사용자·소비자·내비 멤버·테일즈 멤버·블라인드 멤버.

**상품 없음 안내**: 등록된 일반상품이 하나도 없으면 폼 대신 안내 메시지 + "일반상품 등록" 링크(`router.push('/admin/general-items/new')`).

**등록 성공 플로우**: 초록색 성공 박스에서:
1. **"상품 화면에서 확인"** → `router.push('/general-items/[saleId]')` (사용자 화면)
2. **"일반상품 목록"** → `router.push('/admin/general-items')`

**서버 액션 위치**: 판매공고 생성 액션은 `general-items/actions.ts`에 공존(상품 액션과 함께). `productType: "ITEM"`, `saleType: "GENERAL"` 고정으로 생성.

### /admin/general-item-orders — 주문 목록

일반상품 배송 주문 관리. 상세한 화면·액션·CSV 워크플로우 설명은 [orders.md](./orders.md) 참조.

이 문서에서는 일반상품 도메인 관점만 요약:
- RSC에서 `productType=ITEM`, `fulfillmentMethod=DIRECT_DELIVERY`, `saleTiming=IMMEDIATE`로 고정 조회 — 일반상품 즉시 배송 주문만 다룸
- 배송 CSV 일괄 처리(대상 다운로드·검증·실제 발송)는 일반상품 주문 전용 기능
- 행 액션은 주문의 `availableAdminActions`에 따라 동적 활성화(배송 수정·발송·완료·취소 승인·거절·강제 취소)

### /admin/general-item-orders/[orderId] — 주문 상세

[orders.md](./orders.md)의 일반상품 주문 상세 참조. 헤더 타이틀 "일반상품 주문 상세"로 표시.

## 상태 전이

**판매공고 상태** (수동 설정, 자동 전이 아님):
`임시저장(DRAFT) → 판매중(OPEN) → 판매종료(CLOSED)`, `판매중 → 품절(SOLD_OUT)`

> 주문 상태 전이는 [orders.md](./orders.md) 참조. 백엔드가 주도하고 프론트는 `availableAdminActions`로 현재 가능 액션만 노출.

## 데이터 흐름 (개요)

- 모든 페이지 RSC. `getAuthToken()` + `withToken()` 인증.
- 일반상품/판매공고 각각 별도 API 엔드포인트이나, 판매공고는 전용 목록 API가 없어 전체 풀스캔 후 클라이언트 필터링.
- 변경 액션(상품 생성·수정, 판매공고 생성)은 Server Action → Orval API. `revalidatePath`로 관련 캐시 갱신.
- 토큰 리프레시/에러 핸들링은 mutator가 일괄 처리.
- 필터/페이지네이션은 URL searchParams 기반 — 북마크/공유 가능.

## 도메인 연관

- **일반상품(Item)**: 위스키 병(Bottle)이 아닌 배송 주문용 잡상품. 병 예약과 별개 도메인.
- **판매공고(Sale)**: 상품을 실제 판매에 내거는 공고. 일반상품 판매공고는 `productType=ITEM`, `saleType=GENERAL`로 식별. 병 예약 공고와 같은 sales API를 공유하나 타입으로 구분.
- **주문 가능 역할**: 비회원 포함 5개 역할. 역할 미선택 = 비회원까지 주문 가능한 일반 판매. 커뮤니티 멤버십(내비/테일즈/블라인드) 역할별 주문 통제 가능.
- **사용자 화면 연결**: 판매공고 "확인" 링크와 등록 성공 "상품 화면에서 확인"은 모두 사용자 라우트 `/general-items/[id]`로 이동 — 관리자가 사용자 화면을 직접 미리보기.

## 외부 의존

- **인증**: NextAuth (admin 접근 제한)
- **API**: 원격 백엔드 `api.whiskynavi.com` (Orval 코드젠 클라이언트)
- **이미지 업로드**: `ITEM` purpose 이미지 업로드 API

## 참고

- 코드 구조 탐색: `graphify query "admin general-items"` / `codegraph_explore "admin/general-items"`
- 주문 관리(배송·CSV 워크플로우): [orders.md](./orders.md)
- 주문 공용 컴포넌트: `src/app/admin/orders/_components/` — 보틀 주문 관리와 컴포넌트 공유
