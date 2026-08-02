# 사용자 주문 — `/orders/*`

일반상품(위스키 외 잡화) 배송 주문의 비회원 조회 창구와 토스 결제 콜백 라우트. 사용자 화면(main 라우트 그룹). 본 문서의 세 라우트는 모두 **일반상품 배송 주문** 도메인에 속하며, 보틀 예약 주문과는 무관.

## 라우트 맵

| 경로 | 유형 | 비고 |
|---|---|---|
| `/orders/guest` | 비회원 주문 조회 | 주문번호 + 조회 코드로 본인 주문 확인·취소 |
| `/orders/payment/success` | 결제 성공 콜백 게이트 ⚠️ 특수 | 실제 처리 페이지로 강제 리다이렉트 |
| `/orders/payment/fail` | 결제 실패 콜백 게이트 ⚠️ 특수 | 실제 실툴 페이지로 강제 리다이렉트 |

## 도메인 배경

- **일반상품 주문**: 회원/비회원 모두 토스 결제로 배송 주문. 비회원은 주문 완료 시 **조회 코드(guestOrderToken)**를 1회 발급받아 주문번호와 짝으로 비회원 조회 창구에서 확인.
- **결제 흐름 개요** (참고 — 본 라우트 그룹 외부에서 시작):
  1. 장바구니 주문서(`CartDeliveryOrderClient`)에서 토스 결제 티켓 생성 → SDK `requestPayment` 호출. 단일 상품 "바로 주문"도 장바구니 경로로 합류.
  2. 토스가 `successUrl`/`failUrl`로 브라우저를 리다이렉트 — 이 URL이 본 그룹의 `/orders/payment/*` 게이트.
  3. 게이트는 곧바로 실제 처리 페이지(`/general-items/cart/order/toss/*`)로 쿼리 파라미터를 그대로 넘기며 재리다이렉트.
  4. 성공 처리 페이지에서 결제 승인(confirm) Server Action 자동 실행 → 주문 완료 패널 노출.

## 공용 컴포넌트 / 공용 동작

| 요소 | 역할 | 동작 |
|---|---|---|
| 결제 콜백 게이트 (success/fail) | 토스 → 실제 처리 페이지 중계 | `redirect()` RSC 단 강제 리다이렉트. 쿼리 파라미터 보존 전달. 화면 렌더링 없음 |
| `OrderCompletionPanel` (공용) | 결제 승인 후 주문 완료 안내 | 비회원이면 조회 코드 표시 + `/orders/guest?...` 링크. 회원이면 `/my-page?tab=orders` 링크. **조회 코드는 이 화면에서만 재확인 가능** |
| 비회원 조회 URL 동기화 | 조회 성공 시 URL 갱신 | `router.replace('/orders/guest?orderNumber=...&guestOrderToken=...')` — 새로고침/공유/북마크 유지. `replace`라 히스토리에 쌓이지 않음 |

**"목록으로 돌아가기" 버튼 패턴**: 본 그룹에는 목록이 없음. 대신 완료 패널은 "비회원 주문 조회"(회원은 "내 주문 보러가기") + "홈으로" 두 링크 제공. 장바구니 주문서 화면의 뒤로가기는 `router.back()`.

## 페이지별 맥락

### /orders/guest — 비회원 주문 조회 ★

비회원이 자신의 일반상품 배송 주문을 확인하고 취소 요청하는 창구. 로그인 불필요.

**입력 폼**: 주문번호 + 비회원 주문 조회 코드. 제출 → `lookupGuestGeneralItemOrder` Server Action.

**URL 직접 진입 지원**: `orderNumber`·`guestOrderToken` 쿼리 파라미터가 있으면 페이지 진입 즉시 자동 조회. 북마크/공유 링크로 직접 주문 상세 열람 가능.

**조회 성공 시 주문 상세 패널** (두 단):

| 항목 | 예시 |
|------|------|
| 주문번호 | ODR-20260519-000001 |
| 상품명 | 글렌모르 12 |
| 주문 분류 | 일반상품 |
| 수량 | 2개 |
| 총 금액 | ₩180,000 |
| 결제수단 / 결제상태 | TOSS / 결제 완료 |
| 배송 진행 | 배송 중 |
| 수령인 / 연락처 / 주소 | 홍길동 / 010-1234 / 서울 강남... |
| 배송사 / 운송장번호 | CJ대한통운 / 1234567890 |
| 발송일시 / 배송완료일시 | 2026.05.20 / - |

**주문 취소 요청** (조건부 노출):
- 결제 대기·상품 준비 중 상태에서만 취소 폼 노출. 그 외 상태는 숨김.
- 사유 입력 → `cancelGuestGeneralItemOrder` Server Action. 결제 완료 건은 "취소 요청"으로 접수되어 관리자 승인 대기 — 즉시 취소 아님.
- 성공 시 같은 화면에서 갱신된 주문 상태 표시.

**상태 전이 (참고)**:
`주문 접수 → 결제 대기 → 상품 준비 중 → 결제 완료 → 배송 중 → 배송 완료`
`결제 완료 → 취소 요청 → (관리자 승인) 주문 취소` / `취소 요청 → 취소 거절`

### /orders/payment/success — 결제 성공 리다이렉트 게이트 ⚠️ 특수

**목적**: 토스 결제 성공 콜백을 받아 실제 승인 처리 페이지로 중계. 자체 화면 없음.

**특수 동작**:
- `orderId`·`paymentKey`·`amount` 쿼리 파라미터를 그대로 재조립하여 `/general-items/cart/order/toss/success?...`로 `redirect()`.
- RSC 단에서 처리 — 브라우저에 게이트 화면이 렌더링되지 않음.
- **쿼리 파라미터 누락 시에도 리다이렉트는 수행** (빈 쿼리로). 실제 처리 페이지에서 스키마 검증 실패 → 에러 처리.

**실제 처리 페이지 동작** (`/general-items/cart/order/toss/success`):
- 클라이언트 진입 즉시 결제 승인(confirm) Server Action 자동 호출. 중복 실행 방지 ref.
- 승인 성공 → `OrderCompletionPanel` 노출. 장바구니 토큰 쿠키 삭제 + 완료 쿠키 설정(중복 주문 방지).
- 승인 실패 → "같은 결제 정보로 다시 확정" 버튼(재시도) + "주문서로 돌아가기" 링크(`/general-items/cart/order`).

### /orders/payment/fail — 결제 실패 리다이렉트 게이트 ⚠️ 특수

**목적**: 토스 결제 실패/취소 콜백을 실패 안내 페이지로 중계. 자체 화면 없음.

**특수 동작**:
- `code`·`message`·`orderId` 쿼리 파라미터를 그대로 재조립하여 `/general-items/cart/order/toss/fail?...`로 `redirect()`.
- RSC 단 처리, 게이트 화면 렌더링 없음.

**실제 실패 페이지 동작** (`/general-items/cart/order/toss/fail`):
- 에러 코드·메시지·PG 주문 ID 표시. 누락 시 기본 메시지("결제가 취소되었거나 인증에 실패했습니다").
- "주문 다시 시도"(`/general-items/cart/order`) + "장바구니로 돌아가기"(`/general-items/cart`) 링크.

## 레거시 콜백 경로 (참고)

`/general-items/delivery-order/toss/success|fail`도 동일한 리다이렉트 게이트 — `/general-items/cart/order/toss/success|fail`로 쿼리 전달. 과거 단일 상품 주문 경로 잔재. 현재는 모든 결제가 장바구니 경로로 합류하므로 본 그룹의 `/orders/payment/*`와 함께 중복 중계 역할만 수행.

## 데이터 흐름 (개요)

- `/orders/guest` 페이지는 RSC. 검색 파라미터를 클라이언트 컴포넌트 initial 값으로 전달.
- 조회·취소 액션은 비회원 토큰 기반 — `getAuthToken()` 불필요. `guestOrderToken`이 곧 인증 증명.
- 결제 콜백 게이트는 RSC `redirect()` — 데이터 페칭 없음.
- 결제 승인(confirm) 액션은 `buildOptions()`로 인증 토큰 확보 후 백엔드 confirm API 호출.
- 모든 액션은 Zod 스키마 검증 + `guideErrorMessage`로 사용자 친화적 에러 변환.

## 외부 의존

- **토스페이먼츠 SDK**: `https://js.tosspayments.com/v2/standard` — 클라이언트 사이드 결제창 호출. successUrl/failUrl이 본 그룹 라우트.
- **카카오 우편번호 API**: 배송지 주소 검색 (주문서 화면에서 사용, 본 그룹 외부).
- **백엔드 API**: `api.whiskynavi.com` — 비회원 조회/취소, 결제 티켓 생성, 결제 승인(confirm) 엔드포인트.
- **장바구니 토큰 쿠키**: 결제 성공 시 삭제 + 완료 쿠키 설정 — 중복 주문 방지 세션 표식.

## 참고

- 코드 구조 탐색: `graphify query "orders guest payment toss success fail"`
- 결제 승인 처리 상세: `/general-items/cart/order/toss/success` 하위 컴포넌트
- 주문 상태 전이 전체: `order-utils.ts` (STATUS_CONFIG_MAP)
