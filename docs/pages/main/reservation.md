# 사용자 병 예약 — `/reservation/*`

사용자(main) 화면. 위스키내비에서 한정판/신규 출시 위스키 병을 예약 신청하는 곳. 일반 사용자는 1인 1신청, 사업장 관리자 역할을 가진 사용자는 보유 사업장마다 각각 신청할 수 있다. 예약은 기간 기반 — 시작 전 대기, 진행 중 신청, 종료 후 내역 확인의 세 시점이 한 화면에서 전이된다.

## 라우트 맵

| 경로 | 유형 | 비고 |
|---|---|---|
| `/reservation` | 예약 공고 목록 | 비로그인 접근 가능(로그인 유도 모달) |
| `/reservation/[noticeId]` | 단일 공고 상세 + 신청/수정/취소 | ★ 이 화면군 핵심 |

## 공용 컴포넌트 (reservation/_components/)

이 화면군 전반에 쓰이는 공용 UI. 동작 방식 명시.

| 컴포넌트 | 역할 | 동작 |
|---|---|---|
| `Hero` | 페이지 상단 비주얼 헤더(배경 대형 텍스트 + 타이틀 + 서브타이틀) | `(main)` 그룹 공용. 정적 표시 전용 |
| `ReservationCard` | 목록 카드(이미지, 브랜드, 공고명, 가격, 마감/종료일, 상태 배지) | `<Link>`로 감싸져 `href=/reservation/[id]` 이동. 진행중(파랑)/종료(회색) 배지 |
| `TimerDisplay` | 상세 카운트다운 + 상태 라벨 | `useCountdownTimer` 구독. pending→시작 시각, active→마감 시각 카운트다운, applied/closed→종료 시각만 표시 |
| `StatusBadge` | 상세 우측 상태 배지 | 읽기 전용. pending(주황)/active(파랑)/applied(초록)/closed(회색) |
| `InfoList` | 공고 정보 요약(브랜드, 소매가, 공급가, 가용수량, 예약 조건) | 사업장 역할 여부에 따라 공급가 노출. 종료 시 가용수량 숨김 |
| `ApplyForm` | 일반 사용자 신청/수정 폼(수령 업장 선택 + 수량) | `mode="apply"`/`"edit"`. 업장 미선택 시 제출 비활성화 |
| `BusinessApplyForm` | 사업장별 신청/수정 폼(사업장 선택 + 수량) | `mode="apply"`/`"edit"`. edit 시 사업장 선택 읽기 전용 |
| `CancelReservationModal` | 취소 확인 모달 | overlay-kit `overlay.open()` + shadcn Dialog. 확인 버튼 `destructive` |
| `UnauthenticatedGuard` | 비로그인 가드 | 마운트 시 즉시 로그인 유도 모달 오픈. 모달 로그인 버튼 → `router.push('/sign-in?callbackUrl=/reservation')` |
| `LoginPromptModal` | 로그인 유도 모달 | 취소/로그인하기 버튼. 로그인하기는 `router.push` (위와 동일) |
| `EmptyState` | 예약 없음 안내 | 정적 표시 |

## 시간 기반 상태 모델 ★

예약은 서버 시각 기준 4단계 상태로 전이된다. 모든 상태 판정은 클라이언트 로컬 시각이 아닌 **서버 시각**을 기준으로 한다.

| 상태 | 조건 | 화면 동작 |
|---|---|---|
| `pending` | 현재 시각 < 예약 시작 시각 | "예약 대기 중" 버튼 비활성화. 시작 시각까지 카운트다운 |
| `active` | 시작 ≤ 현재 < 마감 | 신청 폼 또는 사업장 신청 UI 노출. 마감 시각까지 카운트다운 |
| `applied` | active 중 이미 신청함 | "예약신청완료" 표시. 수정/취소 버튼(신청 상태일 때만) |
| `closed` | 현재 ≥ 마감 | 신청 불가. 내역만 확인. 가용수량 숨김 |

**서버 시각 동기화**: 로컬 OS 시계는 사용자가 임의로 변경할 수 있어 신뢰하지 않는다. 최초 1회 `/api/server-time`에서 서버 시각을 받아오고, 이후 `performance.now()` 모노토닉 타이머로 경과 시간을 더해 서버 기준 현재 시각을 계산한다. 왕복 지연의 절반을 요청 전송 시점 보정값으로 사용. 동기화 실패 시 로컬 시각으로 폴백.

**타임존 보정**: 백엔드가 타임존 오프셋 없는 문자열(예: `"2026-07-06T10:40:00"`)을 내려주면, 배포 서버(UTC)와 브라우저(KST)가 9시간 다르게 해석하는 문제가 생긴다. 오프셋이 없는 문자열은 항상 KST(+09:00)로 명시해 파싱한다.

## 페이지별 맥락

### /reservation — 예약 공고 목록

**히어로 + 두 섹션 구성**. 로그인 여부와 데이터 존재 여부에 따라 분기.

**비로그인 사용자**: 히어로만 표시 후 `UnauthenticatedGuard` 즉시 로그인 유도 모달 오픈. 모달에서 로그인하면 `callbackUrl=/reservation`으로 되돌아옴.

**로그인 사용자 — 진행 중/종료 예약을 병렬 페칭**:
- 진행 중 예약: `unstable_cache` 30초 재검증
- 최근 종료 예약: `unstable_cache` 5분 재검증
- 두 요청은 `Promise.all` 병렬. 진행 중 API 실패해도 종료 예약은 정상 표시(개별 catch)
- 양쪽 모두 데이터 없으면 `EmptyState`

**진행 중 예약 섹션** (5열 그리드, 모바일 2열):

| 카드 이미지 | 브랜드 | 공고명/병명 | 배지 | 가격 | 마감일 |
|---|---|---|---|---|---|
| 병 이미지 | 글렌피딕 | 스프링 세일 / 글렌피딕 18 | 진행 중(파랑) | ₩180,000 | 마감: 2026-03-31 23:59 |

- 카드 클릭 → `/reservation/[id]` 이동

**종료된 예약 섹션** (4열 그리드, 모바일 2열): 종료일 표시, 회색 배지. 데이터 없으면 섹션 자체 미노출.

### /reservation/[noticeId] — 단일 공고 상세 + 신청/수정/취소 ★

공고 1건의 모든 정보와 현재 사용자의 신청 상태를 한 화면에서 관리. 이 화면군의 핵심.

**접근 제어 (RSC 단)**:
- 비로그인 → `redirect('/sign-in?callbackUrl=/reservation')` 강제 리다이렉트
- 잘못된 ID(양수 아님) → `notFound()`
- API 403 → "접근할 수 없는 예약 공고입니다" 안내 화면 + "예약 공고 목록으로 돌아가기" 링크(`/reservation`)
- API 404 → `notFound()`

**상단 "목록으로 돌아가기"**: `router.back()`이 아닌 `<Link href="/reservation">` — 히스토리 무관하게 항상 목록으로 이동.

**사용자 유형 분기 ★**: 페이지 진입 시 사용자의 사업장 멤버십을 조회해 일반/사업자를 분기한다.

- **사업자 사용자** (business 역할 보유 또는 사업장 멤버십 존재): 보유한 모든 사업장의 신청을 `Promise.all`로 병렬 조회. `?businessId=` 쿼리로 특정 사업장을 사전 선택 가능(유효하지 않으면 `notFound()`). 기본 선택은 1순위 사업장.
- **일반 사용자**: 본인 신청 1건과 픽업 업장 목록을 `Promise.all` 병렬 조회. 사업자가 아닌 경우 일반 데이터를 미리 프리페치(prefetchedGeneralReservationData)해 페이지 로딩 단축.

**레이아웃** (상세 클라이언트):
1. **이미지 캐러셀 + 상태 배지** — 대표 이미지 + 추가 이미지 슬라이드. 우측 상단에 상태 배지
2. **공고 정보** — 공고명, 병명, 브랜드, 소매가, (사업자만)공급가, 가용수량, 예약 조건(등급별 접근 시각)
3. **타이머** — 상태별 카운트다운/종료 시각 표시
4. **액션 영역** — 사용자 유형과 상태에 따라 분기 (아래)
5. **리치 텍스트 설명** — 공고 상세 설명(sanitize 후 렌더)

**액션 영역 분기 (일반 사용자)**:

| 상태 | 신청 전 | 신청 후(수정 가능) | 신청 후(수정 불가) |
|---|---|---|---|
| pending | "예약 대기 중" 비활성 버튼 | — | — |
| active | `ApplyForm` (신청) | "예약신청완료" + 수정/취소 버튼. 수정 시 `ApplyForm mode="edit"` | — |
| closed | (표시 없음) | "예약 신청 내역" (수정/취소 버튼 없음) | — |

수정/취소 버튼은 `status === "active"`이고 신청 상태가 `APPLIED`일 때만 노출. 취소는 `CancelReservationModal` 확인 후 처리.

**액션 영역 분기 (사업자 사용자)**: `BusinessReservationApplications` 컴포넌트로 사업장별 다중 신청 관리.

- **사업장별 신청 내역 목록**: 각 사업장의 신청 수량/확정 수량/픽업 장소/상태 배지 표시. 신청 상태(APPLIED)이고 active일 때 수정/취소 버튼.
- **사업장 추가 신청**: 아직 신청하지 않은 사업장이 있고 active일 때 노출. 모든 사업장 신청 완료 시 "모든 관리 사업장에서 신청을 완료했습니다" 안내.
- pending 시 "예약 대기 중" 비활성 버튼, closed 시 추가 신청 UI 미노출.

**사업장별 신청 내역 테이블** (목록 형태):

| 사업장명 | 상태 | 신청 수량 | 확정 수량 | 픽업 장소 |
|---|---|---|---|---|
| 강남점 | 신청 완료 | 2병 | - | 강남점 (서울 강남) |
| 잠실점 | 확정 | 5병 | 5병 | 잠실점 (경기 일산) |

**데이터 갱신 — 낙관적 로컬 업데이트**: 신청/수정/취소 성공 시 페이지 리로드 없이 로컬 state를 즉시 갱신. 토스트로 성공 안내. 일반 사용자는 `myApplication` state, 사업자는 `currentBusinessApplications` 배열을 직접 조작.

## 변경 액션 (Server Actions)

모든 액션은 클라이언트가 보낸 값을 신뢰하지 않고, **액션 시점에 공고를 서버에서 재조회**해 검증한다.

| 액션 | 일반 | 사업자 | 검증 |
|---|---|---|---|
| 신청 | `applyReservation` | `applyBusinessReservation` | 수량(1~maxOrderQuantity), 예약 active 상태 |
| 수정 | `updateReservation` | `updateBusinessReservation` | 수량, 예약 active 상태(종료 시 거부) |
| 취소 | `cancelReservation` | `cancelBusinessReservation` | 예약 active 상태(종료 시 거부) |

- **종료 후 변경 차단**: 예약이 종료되면 수정/취소 불가. "예약이 종료된 후에는 수정/취소가 불가능합니다." 반환
- **신청 기간 외 차단**: 신청은 active 상태에서만 가능. "지금은 예약 신청 기간이 아닙니다." 반환
- **수량 한도**: 공고의 `maxOrderQuantity`(기본 100) 초과 시 거부. "수량은 1~N병 사이의 정수로 입력해주세요." 반환
- 모든 액션은 `isRedirectError`를 재throw해 Next.js 리다이렉트 정상 동작 보장

## 상태 전이 (신청 건)

```
APPLIED → CONFIRMED → WAITING_PICKUP → RECEIVED → PAYMENT_COMPLETED
APPLIED → REJECTED
APPLIED → CANCELLED (사용자 취소)
```

사용자 화면에서 직접 다루는 전이는 신청(APPLIED)과 취소(CANCELLED)뿐. 이후 확정/픽업/수령/결제는 관리자(`admin/reservations`) 또는 사업자(`business/pickup-reservations`) 화면에서 진행된다. CANCELLED/REJECTED 건은 상세 페이지 진입 시 "적용 중인 신청"에서 제외된다.

## 데이터 흐름 (개요)

- 두 페이지 모두 RSC. `getServerSession(authOptions)`로 세션 확인.
- 상세는 공고/사업장 멤버십/픽업 업장/신청 내역을 `Promise.all` 병렬 페칭.
- 캐시: 진행 중 목록 30s, 종료 목록 5min, 공고 상세 30s (`unstable_cache` + tag).
- 토큰 리프레시/에러 핸들링은 mutator가 일괄 처리.
- 변경 액션은 Server Action → Orval API. 성공 시 로컬 state 낙관적 갱신(리로드 없음).

## 외부 의존

- **인증**: NextAuth v4. 비로그인은 로그인 유도, 상세는 강제 리다이렉트.
- **API**: 원격 백엔드 `api.whiskynavi.com` (Orval 코드젠 클라이언트).
- **서버 시각**: `/api/server-time` 엔드포인트 — 카운트다운 정확도 확보.
- **사업장 멤버십**: `usersBusinessesMe` API — 사업자 분기 및 다중 사업장 신청의 기준.
- **픽업 업장**: `usersBusinessesPickupLocations` API — 일반 사용자 수령 업장 선택지.

## 참고

- 대응 관리자 화면: `docs/pages/admin/reservations.md`
- 대응 사업자 화면: `/business/pickup-reservations/*`
- 코드 구조 탐색: `graphify query "main reservation"` / `codegraph_explore "(main)/reservation"`
