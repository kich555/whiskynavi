# 마이페이지 — `/my-page/*`

사용자 화면(main 라우트 그룹). 로그인한 사용자가 자신의 주문 내역, 멤버십, 사업자 등록 신청, 1:1 문의를 관리. 다크 테마(`#1d2429` 배경) 고정.

## 라우트 맵

| 경로 | 유형 | 비고 |
|---|---|---|
| `/my-page` | 마이페이지 메인 (탭: 주문내역/멤버십) | ★ 이 화면군 핵심 |
| `/my-page/order-[id]` | 주문 상세 (전용 페이지) | 모바일 전용 분기 — 데스크톱은 모달 |
| `/my-page/reservations/[applicationId]` | 주문에 연결된 예약 공고 내용 | 읽기 전용 — 별도 설명 |
| `/my-page/inquiries` | 1:1 문의 목록 | |
| `/my-page/inquiries/[inquiryId]` | 문의 스레드 상세 | ★ 메시지 추가/삭제 |
| `/my-page/inquiries/new` | 신규 문의 작성 폼 | |

## 인증 게이트 (공통)

모든 라우트는 RSC 단에서 세션/토큰을 먼저 확인. 미인증 시 `/sign-in?callbackUrl=<현재경로>`로 리다이렉트. 각 라우트마다 `callbackUrl`이 해당 경로를 가리킴(문의 상세는 `/my-page/inquiries/[id]`, 예약 공고는 `/my-page?tab=orders` 등).

## 공용 컴포넌트 (my-page/_components/)

이 화면군 전반에 쓰이는 공용 UI. 동작 방식 명시.

| 컴포넌트 | 역할 | 동작 |
|---|---|---|
| 주문 상세 모달/페이지 | 주문 1건 상세 정보 | **반응형 분기**: 데스크톱은 overlay-kit 모달, 모바일은 `router.push('/my-page/order-[id]')` 전용 페이지. 동일 데이터, 다른 셸 |
| 주문 취소 모달 | 주문 취소 사유 입력 → `cancelOrder` Server Action | overlay-kit 중첩 열림(상세 모달 위에 취소 모달). 성공 시 `revalidatePath('/my-page')`로 목록 갱신 |
| 사업자 등록 폼 | 사업자 등록 신청/취소 | overlay-kit Dialog(데스크톱)/Drawer(모바일) 반응형 분기. 성공 시 자동 닫기 |
| RichTextImageEditor | 리치텍스트 + 이미지 업로드 에디터 (문의) | 클라이언트에서 `postApiBoardsUploads` 직접 호출 후 에디터에 URL 삽입. `onUploadingChange`로 제출 버튼 비활성화 동기화 |

**"목록으로 돌아가기" 버튼 패턴**: 상세·폼 페이지 상단. 모두 `Link href` 기반 `push` 이동(문의 상세·신규 → `/my-page/inquiries`, 주문 상세 → `/my-page?tab=orders`, 예약 공고 → `/my-page/order-[id]`). `router.back()` 미사용 — 히스토리 의존성 없이 안전한 이동.

## 페이지별 맥락

### /my-page — 마이페이지 메인 ★

사용자 정보 카드 + 탭(주문내역/멤버십) + 사업자 등록 섹션 + FAQ. 이 화면군의 허브.

**RSC 데이터 페칭**: 사용자 정보, 주문 목록(최신 10건), 사업자 신청 개요를 `Promise.all` 병렬 페칭. 각 API는 독립적으로 catch — 일부 실패해도 페이지 렌더링(빈 데이터 대체).

**탭 전환** (URL 동기화):
- `tab=orders`(기본) / `tab=membership`
- 전환 시 `window.history.replaceState`로 URL만 갱신(라우트 재페칭 없음) — 클라이언트 state로 뷰 전환
- `tab=membership`으로 전환 시 `page` 파라미터 제거(주문 페이지네이션 맥락 초기화)
- 최초 진입 시 `?tab=membership`이면 멤버십 탭부터 활성화

**주문내역 탭** — 주문 카드 목록 + 페이지네이션:

| 주문번호 | 주문일 | 상태 배지 | 공고명/상품명 | 보틀명 | 주문 분류 | 총 금액 |
|---|---|---|---|---|---|---|
| WB-2026-0301 | 2026.03.05 | 배송중 | 스프링 세일 | 글렌피딕 18 | 보틀 · 픽업 · 예약판매 | ₩360,000 |
| WB-2026-0287 | 2026.02.28 | 수령완료 | 맥콜 12 | | 보틀 · 직배송 · 바로배송 | ₩95,000 |

- **주문 분류**: `보틀·픽업·예약판매` 형태의 결합 라벨 (productType · fulfillmentMethod · saleTiming)
- **상태 배지**: 주문 상태별 색상 매핑 (접수=노랑, 결제대기=주황, 준비중/배송중=파랑, 완료=초록, 취소=빨강 등)
- **행 클릭 = 반응형 분기**: 데스크톱은 주문 상세 모달, 모바일은 `router.push('/my-page/order-[id]')`
- **페이지네이션**: URL 기반(`?page=&tab=orders`) — 북마크/공유 가능

**나의 멤버십 탭**:
- 위스키내비(NAVI) / 더 위스키테일즈(TALES) 멤버십 카드 2종
- 사용자 `roles`에 따라 "가입됨/미가입" 배지 + 혜택 목록 표시
- 가입 버튼은 현재 비활성화(주석 처리) — 안내 전용

**사업자 등록 섹션** (탭 하단, 항상 노출):
- 사업자 등록 신청 이력 개요(최신 신청, 진행 중 신청들) 표시
- "사업자 등록하기" / "새 사업자 등록"(이력 있을 때) 버튼 → overlay-kit 폼
- "신청내역보기" 버튼(이력 있을 때만) → 사업자 신청 이력 모달
- 진행 중(PENDING) 신청은 건별 "사업자 등록 취소하기" 버튼 노출

**사업자 등록 신청 폼** (오버레이):
- 입력: 사업자명, 연락처, 사업자등록번호, 사업자 구분(가정용 HOUSEHOLD / 유흥용 ENTERTAINMENT), 픽업 주소(선택), 개업일(yyyy-MM-dd, 캘린더 피커), 대표자명, 사업자등록증 파일(PDF/JPG/PNG, 10MB 이하)
- 제출 성공 시 오버레이 자동 닫기 + `revalidatePath('/my-page')`
- **상세 에러 매핑**: 국세청 검증 실패(400), 권한 없음(403), 신청 주소 변경(404), 중복/진행 중(409), 파일 크기(413), 파일 형식(415), 요청 과다(429), 서버 오류(5xx) 각각 사용자 친화적 메시지 + `hint`/`code`/`requestId` 구조화 전달

**사업자 등록 상태**: `PENDING`(심사중) / `APPROVED`(승인완료) / `REJECTED`(거부됨, 거부 사유 표시) / `CANCELED`(취소됨). PENDING만 취소 가능.

**사용자 정보 카드**:
- 이름, `@username`, 이메일, 멤버십 배지(NAVI/TALES) 표시
- "내 정보 수정" → overlay-kit 프로필 수정 폼(닉네임, 이메일, 마케팅 수신 동의). 이메일 변경 시 인증 코드 발송→검증 흐름 필수
- "비밀번호 변경" → overlay-kit 비밀번호 변경 폼(현재/새/확인). 새 비밀번호 8자 이상, 확인 일치 검증

### /my-page/order-[id] — 주문 상세 (전용 페이지)

**목적**: 모바일에서 주문 카드 클릭 시 이동. 데스크톱은 모달로 동일 내용을 보여주므로 이 페이지는 모바일 진입이 주된 경로. 단, 직접 URL 진입/공유도 가능(모바일이 아닌 환경에서도 렌더링됨).

**RSC**: 주문 ID로 단건 조회. ID가 양수 정수가 아니면 `notFound()`. 데이터 없으면 `notFound()`.

**뷰 구성**:
1. 상단 "돌아가기" → `Link href="/my-page?tab=orders"` (히스토리 의존 아님)
2. 주문 상태 배지 + 주문일. 취소 가능 상태면 "주문 취소" 버튼(destructive)
3. 상품 정보: 공고명/상품명, 보틀명(예약 주문만), 신청 수량, 배정 수량, 단가, 총 금액
4. 주문 정보: 주문일시, 주문 분류, 주문 메모, 취소 사유(취소 건만)
5. 결제 정보(결제 데이터 있을 때만): 결제수단, 결제상태, 결제금액, 결제일
6. 배송 정보(배송 데이터 있을 때만): 배송 진행, 수령인, 연락처, 주소, 배송 메모, 배송사(기본 CJ대한통운), 운송장번호, 발송일, 배송완료일
7. **보틀 예약 주문이면 "공고 내용 보기" 버튼** → `Link href="/my-page/reservations/[order.id]"` (applicationId = orderId)

**주문 취소 허용 조건** (핵심 도메인 규칙):
- `saleTiming !== "RESERVATION"` — **예약판매(RESERVATION) 주문은 취소 불가**
- 상태가 `ORDER_REQUESTED`(주문 접수) / `PAYMENT_PENDING`(결제 대기) / `ORDER_PREPARING`(준비 중) 중 하나
- 두 조건 모두 만족할 때만 취소 버튼 노출. 바로배송(IMMEDIATE) 주문도 위 상태에서만 취소 가능

**주문 상태 전이**:
`주문 접수 → 결제 대기 → 준비 중 → 배송중 → 배송완료` (직배송)
`주문 접수 → 결제 대기 → 준비 중 → 수령 대기 → 수령완료` (픽업)
`주문 접수/결제 대기/준비 중 → 취소 요청 → (승인 시) 주문 취소 / (거절 시) 취소 거절`

### /my-page/reservations/[applicationId] — 주문에 연결된 예약 공고 내용 ⚠️ 특수

**목적**: 보틀 예약 주문에서 "공고 내용 보기"로 진입. 사용자가 자신의 주문과 연결된 예약 공고의 내용을 **읽기 전용으로 확인**. 이 화면에서는 신청/수정 불가.

**RSC**: applicationId로 관련 공고 조회. 404면 `notFound()`.

**접근 사유 표시** (상단 안내 배너):
- `PICKUP_BUSINESS_ASSIGNMENT` → "픽업 사업장 관계로 열람 중"
- 그 외 → "과거 신청 관계로 열람 중"
- "이 화면에서는 공고 내용만 확인할 수 있습니다." 명시

**뷰**: 브랜드, 예약 기간, 소매가, 인당 최대 수량, 공고 이미지 캐러셀, 공고 설명(리치텍스트), 원래 신청 조건(역할별). **사업자 역할(`hasBusinessRole`)이면 공급가(supplyPrice) 추가 노출** — 일반 사용자는 소매가만.

**"주문 상세로 돌아가기"** → `Link href="/my-page/order-[applicationId]"` (들어온 경로의 역순)

### /my-page/inquiries — 1:1 문의 목록

**RSC**: 문의 목록을 `lastMessageAt` 내림차순 정렬로 페이지별 조회(10건/페이지).

**상단 액션**: "문의하기" 버튼 → `/my-page/inquiries/new`. "마이페이지" 링크 → `/my-page`.

**문의 목록** (행 클릭 = `Link href="/my-page/inquiries/[id]"`):

| 상태 배지 | 문의번호 | 제목 | 최근 메시지 시각 |
|---|---|---|---|
| 답변 대기 | 문의 #42 | 배송 언제 오나요 | 2026.03.05 14:32 |
| 답변 완료 | 문의 #41 | 결제 수단 변경 문의 | 2026.03.04 10:15 |

- **상태**: `WAITING`(답변 대기, 주황) / `ANSWERED`(답변 완료, 초록) / `CLOSED`(문의 종료, 회색)
- **정렬 기준**: 최근 메시지 시각(`lastMessageAt`) 내림차순 — 답변이 달리면 위로 올라옴
- 빈 목록 시 안내 메시지("등록한 문의가 없습니다")
- 페이지네이션: URL 기반(`?page=`), 이전/다음 링크. 첫/말 페이지에서는 비활성화된 화살표 표시

### /my-page/inquiries/[inquiryId] — 문의 스레드 상세 ★

**RSC**: 문의 1건 + 메시지 전체 조회. ID가 양수 정수가 아니거나 404면 `notFound()`.

**뷰 구성**:
1. "문의 목록으로" → `Link href="/my-page/inquiries"`
2. 헤더: 상태 배지, 문의번호, 제목, 최근 메시지 시각, **문의 삭제 버튼**(우상단)
3. **메시지 스레드**: USER 메시지(우측 흰색 말풍선) / 운영자 메시지(좌측 어두운 말풍선)를 시간순 렌더. 작성자 닉네임 표시(운영자는 "위스키내비" 폴백). 리치텍스트 렌더(sanitize 적용)
4. **추가 메시지 입력폼** (하단): `InquiryMessageForm`. 리치텍스트 + 이미지 업로드. 제출 성공 시 폼 리셋 + `router.refresh()`로 스레드 갱신

**상태 전이/비활성화 조건**:
- `CLOSED`(문의 종료) 상태면 **추가 메시지 입력폼 비활성화** — "종료된 문의에는 메시지를 추가할 수 없습니다." 안내
- `WAITING` / `ANSWERED` 상태만 추가 메시지 가능

**문의 삭제 버튼** (2단계 확인 패턴):
- 1차 클릭 → 버튼 텍스트 "한 번 더 눌러 삭제"로 변경(`confirmed` state)
- 2차 클릭 → `deleteInquiryAction` Server Action 호출. `useTransition`으로 pending 표시
- 성공 시 `toast.success` + `router.push('/my-page/inquiries')` + `router.refresh()`
- 실패 시 `toast.error`. `onBlur` 시 `confirmed` 리셋

### /my-page/inquiries/new — 신규 문의 작성

**목적**: 표준 생성 폼. 제목(200자 이하) + 리치텍스트 내용(이미지 업로드 지원).

**흐름**:
- "취소" 버튼 → `Link href="/my-page/inquiries"` (목록으로)
- 제출 → `createInquiryAction` Server Action. Zod 검증(제목 1~200자, 내용 필수). 리치텍스트 sanitize 후 빈 내용(이미지만 있는 경우 포함) 검증
- **성공 시 `redirect('/my-page/inquiries/[생성된id]')`** — 생성된 문의 상세로 즉시 이동(목록을 거치지 않음)
- 실패 시 폼 내 에러 메시지 표시, 입력 유지

## 데이터 흐름 (개요)

- 모든 페이지 RSC. `getAuthToken()` + `withToken()` 인증. 미인증 시 콜백 URL과 함께 로그인 리다이렉트.
- 메인은 `Promise.all`로 사용자/주문/사업자개요 병렬 페칭, 개별 catch로 부분 실패 허용.
- 변경 액션(주문 취소, 프로필/비밀번호 변경, 사업자 신청/취소, 문의 생성/메시지 추가/삭제)은 Server Action → Orval API. `revalidatePath('/my-page')` 또는 `/my-page/inquiries`로 캐시 갱신.
- 토큰 리프레시/에러 핸들링은 mutator가 일괄 처리.
- 탭 전환/페이지네이션은 URL searchParams 기반 — 북마크/공유 가능. 탭은 `replaceState`로 URL만 갱신(재페칭 없음).
- 주문 상세는 반응형 분기(데스크톱 모달 / 모바일 전용 페이지)로 동일 데이터를 다른 셸에 렌더.

## 외부 의존

- **인증**: NextAuth (세션/토큰). 각 라우트마다 `callbackUrl` 지정 리다이렉트
- **API**: 원격 백엔드 `api.whiskynavi.com` (Orval 코드젠 클라이언트)
- **이미지 업로드**: 문의/리치텍스트 에디터는 `postApiBoardsUploads`를 클라이언트에서 직접 호출 (Server Action 경유하지 않음)
- **오버레이**: overlay-kit + shadcn Dialog(데스크톱) / Drawer(모바일) 반응형 분기
- **멤버십 역할**: NAVI / TALES 멤버십은 사용자 `roles`로 판별 — 멤버십 탭, 프로필 카드 배지, 예약 공고 공급가 노출 여부에 영향
- **사업자 역할**: `hasBusinessRole` 여부가 예약 공고의 공급가 노출을 결정

## 참고

- 코드 구조 탐색: `graphify query "my-page orders inquiries business registration"` / `codegraph_explore "(main)/my-page"`
- 주문 상태/취소 조건 정의: `my-page/_lib/constants.ts`
- 주문 분류 라벨: `src/lib/order-classification.ts`
- 관련 공고 컴포넌트(공용): `src/components/reservation/RelatedNoticeDetail.tsx`
