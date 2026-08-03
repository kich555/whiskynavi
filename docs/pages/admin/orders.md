# 관리자 주문 관리 — `/admin/orders/*`

일반상품 주문과 보틀 주문을 관리자가 관리. 주문 상태 변경, 배송 정보 수정·발송·완료 처리, 취소 승인·거절, 배송 CSV 일괄 검증·발송. 보틀 주문은 조회 전용.

## 라우트 맵

| 경로 | 유형 | 비고 |
|---|---|---|
| `/admin/orders` | 리다이렉트 | ★ 특수 — `general-item-orders`로 강제 이동 |
| `/admin/general-item-orders` | 일반상품 주문 목록 | ★ 이 화면군 핵심 — 배송 액션·CSV 워크플로우 |
| `/admin/general-item-orders/[orderId]` | 일반상품 주문 상세 | |
| `/admin/bottle-orders` | 보틀 주문 목록 | 조회 전용 — 액션 없음 |
| `/admin/bottle-orders/[orderId]` | 보틀 주문 상세 | |

## 공용 컴포넌트 (admin/_components/)

이 화면군 전반에 쓰이는 공용 UI. 동작 방식 명시.

| 컴포넌트 | 역할 | 동작 |
|---|---|---|
| `AdminHeader` | 상단 헤더(타이틀, 사이드바 토글) | 사이드바 토글은 context. 검색 비활성화(showSearch=false) — 본문 필터 영역에서 별도 처리 |
| `Pagination` | URL 기반 페이지네이션 | `router.push(basePath?page=&limit=&...)`. 북마크/공유 가능 |

**공용 컴포넌트가 아닌 공유 컴포넌트**: `AdminOrdersContent`(목록)와 `AdminOrderDetailContent`(상세)는 `orders/_components/`에 있으나 두 라우트(general-item-orders, bottle-orders)가 공유한다. `enableGeneralItemActions` 플래그로 일반상품 전용 배송 액션·CSV 워크플로우 활성화 여부를 결정한다.

**"주문 목록으로 돌아가기" 버튼 패턴**: 상세 페이지 상단. `router.back()` 사용 — 브라우저 히스토리 기반이라 직접 진입 시엔 이전 페이지가 없을 수 있음. 안전한 이동 필요 시 `router.push('/admin/general-item-orders')` 또는 `router.push('/admin/bottle-orders')`로 대체 고려.

## 페이지별 맥락

### /admin/orders — 리다이렉트 게이트 ⚠️ 특수

**목적**: 구 라우트 호환성. 더 이상 독립 주문 목록이 존재하지 않으며, 일반상품 주문 목록이 기본 화면.

**강제 리다이렉트**: RSC 단에서 `redirect()`로 searchParams를 그대로 넘겨 `/admin/general-item-orders?...`로 즉시 이동. 렌더링 없음 — 이 URL을 북마크한 사용자는 자동으로 새 라우트로 안내.

### /admin/general-item-orders — 일반상품 주문 목록 ★

일반상품(상품유형=ITEM, 배송방식=직배송, 판매시기=바로배송) 주문 전체를 관리. 배송 처리가 핵심 기능.

**필터 영역** (URL searchParams 기반 — 북마크/공유 가능):
- 검색어(주문번호·고객명·연락처·상품명) — Enter 또는 검색 버튼 시 `keyword` 파라미터, 페이지 1로 리셋
- 주문상태 / 결제수단 / 결제상태 / 비회원 여부 드롭다운

**배송 CSV 워크플로우** (일반상품 전용):
1. **대상 다운로드** — 일반상품 직배송 주문 전체를 CSV로 내보내기
2. **검증(dry run)** — CSV 업로드 후 실제 반영 없이 행별 성공/실패 시뮬레이션
3. **실제 처리** — 검증 후 운송장 정보 일괄 반영 및 발송 처리

검증 결과는 행별 테이블(행번·주문번호·성공여부·메시지)로 표시.

**주문 테이블** (행 액션은 주문의 `availableAdminActions`에 따라 동적 활성화):

| 주문 | 고객 | 상품 | 결제 | 배송 | 관리 |
|-----|------|------|------|------|------|
| ORD-2026-0312 / 2026.03.05 14:32 / `결제 대기` | 홍길동 / 010-1234 / 회원 | 글렌피딕 18 / 총 2개 / 상품 ₩180,000 / 배송비 ₩3,000 / 총 ₩183,000 | TOSS / DONE | CJ대한통운 / 12345678 / 서울 강남구 | [상세][배송 수정][발송][배송 완료][주문 취소] |
| ORD-2026-0313 / 2026.03.05 15:01 / `취소 요청` | 김사장 / 010-5678 / 비회원 | 맥콜 12 / `관리자 수동` / 총 1개 / ₩95,000 | - / - | 배송 준비 중 / - | [상세][취소 승인][취소 거절] |

- **행 액션**(관리 열): 상세(항상), 배송 수정·발송·배송 완료·주문 취소·취소 승인·취소 거절 — 주문 상태에 따라 개별 활성화. 가능 액션이 없으면 "가능 액션 없음" 표시
- **상품 셀**: 라인 아이템 최대 2개 표시, 나머지는 "외 N개 상품". 가격 breakdown(상품합계·배송비·총액·무료배송 여부) 표시
- **주문 출처 배지**: 장바구니/단건/관리자 수동 구분

**배송 모달** (Dialog):
- **수정 모드**: 배송사·운송장번호·수령인·연락처·주소·배송 메모 전체 편집
- **발송 모드**: 배송사(기본값 CJ대한통운)·운송장번호만 입력. 운송장번호 필수 — 미입력 시 차단
- 저장 성공 시 `router.refresh()`로 목록 갱신

### /admin/general-item-orders/[orderId] — 일반상품 주문 상세

단일 주문의 전체 정보를 섹션별로 표시. 읽기 전용 — 액션은 목록에서 처리.

**상단 액션바**:
- "주문 목록으로 돌아가기" → `router.back()` ⚠️ 공용 패턴
- 주문 상태 배지

**섹션 구성**:
1. **주문 정보** — 주문번호, 생성 방식(장바구니/단건/관리자 수동), 주문 분류(상품유형·배송방식·판매시기 조합), 생성일시, 상품 요약, 라인 수, 총 수량, 가능 액션 목록, 주문 메모
2. **고객 정보** — 고객명, 회원/비회원 구분, 연락처, 이메일, 사용자 ID, 로그인 ID
3. **결제 정보** — 결제수단, 결제상태, 결제 금액, 결제 완료일
4. **상품 라인** — 라인 아이템 테이블(상품명·판매공고·상품유형·단가·수량·라인 합계). 라인 아이템이 없으면 단일 상품 요약으로 대체
5. **배송 정보** — 수령인, 연락처, 주소, 배송사, 운송장번호, 발송일, 배송 완료일, 배송 메모
6. **금액 요약** — 상품 합계, 배송비, 할인, 최종 금액. 무료배송 적용 여부 + 기준 금액 + 남은 금액 표시

### /admin/bottle-orders — 보틀 주문 목록

보틀(상품유형=BOTTLE) 주문 전체 조회. **조회 전용 — 배송 액션·CSV 워크플로우 없음**. 상세한 화면/필터/도메인 설명은 [bottle-orders.md](./bottle-orders.md) 참조.

핵심 차이(일반상품 vs 보틀):

| 구분 | 보틀 주문 | 일반상품 주문 |
|---|---|---|
| 배송방식 | 직배송/픽업 — 사용자 필터 선택 | 직배송 고정 |
| 배송시기 | 바로배송/예약판매 — 사용자 필터 선택 | 바로배송 고정 |
| 관리 액션 | 조회 전용 (상세 버튼만) | 배송 수정·발송·완료·취소·CSV |
| 행 관리 열 | "조회 전용" 텍스트 | `availableAdminActions` 기반 액션 버튼들 |

### /admin/bottle-orders/[orderId] — 보틀 주문 상세

일반상품 상세와 동일한 `AdminOrderDetailContent` 공유. 섹션 구성 동일(상세는 [bottle-orders.md](./bottle-orders.md) 참조). 상단 타이틀 "일반상품 주문 상세"로 고정 표시. 읽기 전용.

## 상태 전이

주문 상태는 백엔드 API가 주도하고, 프론트는 `availableAdminActions`로 현재 가능한 액션만 노출.

```
결제 대기 → 준비 중 → 배송 중 → 배송 완료
취소 요청 → 주문 취소 (승인) 또는 취소 거절
(강제 취소: 관리자 판단으로 임의 상태에서 주문 취소 가능)
```

**액션 활성화 조건** (백엔드가 주체 — 프론트는 `availableAdminActions` 배열 체크):
- `SHIP_DELIVERY` — 발송 가능 상태일 때만
- `COMPLETE_DELIVERY` — 배송 중일 때만
- `UPDATE_DELIVERY` — 배송 정보 수정 가능 상태일 때만
- `FORCE_CANCEL` — 강제 취소 가능 상태일 때만
- `APPROVE_CANCEL` / `REJECT_CANCEL` — 취소 요청 상태일 때만

**취소/거절 액션 시 사유 입력 필수** — `window.prompt()`로 사유 받음. 빈 값이면 차단.

## 데이터 흐름

- 모든 목록 페이지 RSC. `getAuthToken()` + `withToken()` 인증.
- 두 목록 모두 동일 Orval API(`getApiAdminOrders`) 호출, 차이는 쿼리 파라미터(`productType`, `fulfillmentMethod`, `saleTiming`).
- 상세 페이지는 `getApiAdminOrdersOrderid` 단건 조회. 404 응답 시 `notFound()` 처리.
- 변경 액션(발송·배송수정·완료·상태변경·CSV업로드)은 Server Action → Orval API.
- 액션 성공 시 `revalidatePath`로 세 라우트(`/admin/orders`, `/admin/general-item-orders`, `/admin/bottle-orders`) 동시 갱신.
- 토큰 리프레시/에러 핸들링은 mutator가 일괄 처리.
- 필터/페이지네이션은 URL searchParams 기반 — 북마크/공유 가능.

## 도메인 개념

- **상품 유형(productType)**: `ITEM`(일반상품) vs `BOTTLE`(보틀). 관리 액션 권한 차등의 근본 기준.
- **배송 방식(fulfillmentMethod)**: `DIRECT_DELIVERY`(직배송) vs `PICKUP`(픽업). 보틀 주문은 픽업 가능.
- **판매 시기(saleTiming)**: `IMMEDIATE`(바로배송) vs `RESERVATION`(예약판매). 보틀 주문은 예약판매 가능.
- **주문 출처(orderSource)**: `CART`(장바구니) / `SINGLE_ITEM`(단건) / `ADMIN_MANUAL`(관리자 수동). 라인 수로 추론 가능.
- **무료배송**: 임계 금액 도달 시 적용. 상세에 기준 금액·남은 금액 표시.
- **비회원 주문**: `guestOnly` 필터로 분리 조회. 비회원은 고객 ID가 없고 연락처/이메일로 식별.

## 외부 의존

- **인증**: NextAuth (admin 접근 제한)
- **API**: 원격 백엔드 `api.whiskynavi.com` (Orval 코드젠 클라이언트)
- **결제**: 토스(Toss) — 현재 유일 결제수단
- **배송사**: CJ대한통운(기본값, 수정 가능)

## 참고

- 코드 구조 탐색: `graphify query "admin orders"` / `codegraph_explore "admin/orders"`
- 주문 분류 헬퍼: `src/lib/order-classification.ts` (상품유형·배송방식·판매시기 라벨 조합)
- 상태 라벨/색상 매핑: `src/app/admin/constants.ts`
