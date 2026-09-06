# 관리자 회원 관리 — `/admin/users/*`

가입 회원을 관리자가 관리. 회원 목록 조회/검색/필터, 상세 조회(주문 요약 포함), 권한·상태 변경, 수동 구매내역 추가, 회원 삭제. 일반 사용자 정보 수정이 아닌 관리 권한의 계정 관리 화면.

## 라우트 맵

| 경로 | 유형 | 비고 |
|---|---|---|
| `/admin/users` | 회원 목록 | 검색·필터·정렬 |
| `/admin/users/[userId]` | 회원 상세 + 주문 요약 | ★ 이 화면군 핵심 |
| `/admin/users/[userId]/edit` | 회원 정보 수정(권한/상태) | 읽기 전용 상세와 폼을 한 컴포넌트가 모드 전환 |

## 공용 컴포넌트 (admin/_components/, admin/components/)

이 화면군 전반에 쓰이는 공용 UI. 동작 방식 명시.

| 컴포넌트 | 역할 | 동작 |
|---|---|---|
| `AdminHeader` | 상단 헤더(타이틀, 사이드바 토글, 검색) | 상세/수정에선 검색 비활성. 사이드바 토글은 context |
| `Pagination` | URL 기반 페이지네이션 | `router.push(basePath?page=&limit=&...)`. 북마크/공유 가능 |
| `FilterHeader` | 테이블 헤더 내 필터 드롭다운 | `useTableFilter` 기반, URL searchParams 동기화 |
| `AdminUserDetailSection` | 상세/수정 공용 본체 (admin/components/) | `isEditMode` prop으로 읽기 전용↔편집 전환. 상세·수정 양쪽에서 재사용 |
| `AdminConfirmModal` | 관리자 권한 추가 확인 (admin/components/modals/) | ROLE_ADMIN/SUPER_ADMIN 추가 시 경고 모달 |

**"목록으로 돌아가기" 버튼 패턴**:
- 상세 → "회원 목록으로 돌아가기" → `router.back()` ⚠️ 공용 패턴. 직접 진입 시 이전 페이지가 없을 수 있음.
- 수정 → "회원 상세로 돌아가기" → `router.back()`.
- 삭제 성공 → `router.push('/admin/users')` (목록로 강제 이동, `back()` 아님).

## 도메인 — 회원 역할

한 회원은 여러 역할(roles)을 동시 보유. 목록 필터와 상세 권한 편집의 기준.

- **회원 유형**(단일 표시, 우선순위): 총괄관리자 > 관리자 > 일반회원
- **커뮤니티 멤버십**(중복 가능): 내비 멤버, 테일즈 멤버 — 수량 한도 차등 등의 기준
- **비즈니스 역할**(중복 가능): 트레일테일·커뮤니티·픽업 사업자
- **할당 가능 권한**(수정 화면 드롭다운): GUEST 제외 전 역할. 이미 보유한 권한은 드롭다운에서 제외

## 페이지별 맥락

### /admin/users — 회원 목록

**회원 테이블** (열 순서):

| ID | 이름 | 사용자명 | 이메일 | 회원 유형 | 내비 | 테일즈 | 업장 | 상태 | 가입일 | 관리 |
|----|------|----------|--------|-----------|------|--------|------|------|--------|------|
| 42 | 홍길동 | @hong | hong@x.com | 일반회원 | 내비 | - | - | 활성 | 2026.03.05 | [상세][수정][삭제] |
| 7 | 김관리 | @admin | admin@x.com | 관리자 | - | 테일즈 | - | 비활성 | 2026.01.12 | [상세][수정][삭제] |

- **행 액션**(관리 열): 상세(`router.push`), 수정(`router.push`), 삭제(확인 모달 → `deleteUserAction`)
- **정렬**: 이름·사용자명 헤더 클릭 — `sortBy`/`sortDirection` 파라미터, 페이지 1로 리셋
- **검색**: 헤더 검색창 + 검색필드 선택(이름·사용자명·이메일). `q`/`searchField` 파라미터, 페이지 1로 리셋

**필터**(FilterHeader 드롭다운, URL 기반):
- **회원 유형**: 전체/총괄관리자/관리자/일반회원 — `role` 파라미터(긍정 필터)
- **내비**: 전체/가입/미가입 — 가입=긍정 `role`, 미가입=`excludedRoles` 파라미터
- **테일즈**: 전체/가입/미가입 — 내비와 동일 패턴
- **업장**: 전체/트레일테일/커뮤니티/픽업 — `role` 파라미터(비즈니스 역할)
- **상태**: 전체/활성/비활성

⚠️ **역할 필터 특수 동작**: 회원 유형·업장·내비·테일즈는 서로 다른 필터 키지만 모두 `role`/`excludedRoles` 두 파라미터로 직렬화. 한 필터 선택이 다른 필터의 상태에 영향. 필터 변경 시 항상 페이지 1로 리셋. 이 변환은 `filters.ts`의 `buildAdminUserRoleFilterParams`가 전담.

### /admin/users/[userId] — 회원 상세 + 주문 요약 ★

회원 1건 기본 정보 + 주문 내역을 한 화면에서 관리. RSC에서 회원 정보와 주문 요약을 `Promise.all` 병렬 페칭. 페칭 실패 시 `notFound()`.

**상단 액션바**:
- "회원 목록으로 돌아가기" → `router.back()` ⚠️ 공용 패턴
- 구매내역 추가 → `overlay.open()` 모달 (userId 없으면 비활성)
- 수정 → `router.push('/admin/users/[userId]/edit')`
- 삭제 → `UserDeleteModal`. 성공 시 `router.push('/admin/users')` (목록로)

**섹션 구성** (`AdminUserDetailSection`, 읽기 전용 모드):
1. **기본 정보** — 이름, 사용자명, 이메일, 전화번호, 계정 상태(읽기 전용 표시)
2. **탭**: "회원 상세 정보" / "예약 내역 (N)"
   - **회원 상세 정보 탭**: 활동 정보(가입일·마지막 로그인), 소셜 로그인 연동(Google/Kakao/Naver 배지), 권한 및 멤버십(읽기 전용), 약관 동의 정보(개인정보·마케팅·이메일·SMS)
   - **예약 내역 탭**: 총 구매 금액/주문 수 요약 카드 + 주문 테이블 + 페이지네이션
3. **제재 정보** — `isBanned` true일 때만 표시 (사유·시작일·종료일)
4. **게시글 작성 제한** — `isPostCreationRestricted` true일 때만 표시 (사유·시작일·종료일)

**주문 테이블** (예약 내역 탭):

| 제품명 | 주문번호 | 주문분류 | 신청수량 | 배정수량 | 금액 | 주문일 | 상태 |
|--------|----------|----------|----------|----------|------|--------|------|
| 글렌피딕 18 | ORD-2026-001 | 일반구매 | 2병 | 2병 | ₩360,000 | 2026.03.05 | 결제완료 |
| 맥콜 12 | ORD-2026-002 | 픽업예약 | 1병 | - | ₩95,000 | 2026.03.06 | 신청완료 |

- 주문 페이징은 URL 기반(`page`/`limit`), `tab=reservations` 파라미터로 탭 유지

### /admin/users/[userId]/edit — 회원 정보 수정

상세와 동일한 `AdminUserDetailSection`을 편집 모드(`isEditMode`)로 렌더. 별도 폼이 아니라 상세 뷰 위에 편집 컨트롤이 추가되는 구조. RSC에서 회원 단건 페칭, 실패 시 `notFound()`.

**상단 액션바**:
- "회원 상세로 돌아가기" → `router.back()`
- 구매내역 추가 → 모달 (상세와 동일)

**편집 가능 항목** (읽기 전용 상세에서 활성화되는 컨트롤):
- **계정 상태**: Switch 토글 → `updateUserStatusAction` (ACTIVE/INACTIVE). `router.refresh()`로 갱신
- **권한 추가/제거**: "권한 수정" 버튼 → 인라인 편집 모드
  - 보유 권한 옆 X 버튼 → `removeUserRolesAction`
  - 드롭다운에서 권한 선택 + 추가 → `addUserRolesAction`
  - ⚠️ **관리자 권한(ROLE_ADMIN/ROLE_SUPER_ADMIN) 추가 시 확인 모달** (`AdminConfirmModal`) — 위험 동작으로 2단계 확인
  - 이미 보유한 권한은 드롭다운에서 제외, 보유 권한 추가 시 토스트 에러
  - 모든 권한 변경 후 `router.refresh()`

**구매내역 추가 모달** (상세·수정 공통):
- 보틀 검색 콤보박스 — `searchManualPurchaseBottlesAction`으로 보틀 풀 검색(키워드 100자 제한, 20건). 300ms 디바운스, LRU 캐시(50건). 보틀 선택 시 소비자가로 단가 자동 세팅
- 단가·수량·메모(500자) 입력 → `createManualPurchaseAction` (Zod 검증). 성공 시 `router.refresh()`

## 상태 전이

- **계정 상태**: `ACTIVE ↔ INACTIVE` (Switch 토글). `DELETED`는 삭제 액션으로만 진입(soft delete, 회원 상태 변경)
- **권한**: 임의 역할 추가/제거 — 상태 머신 없음, 즉시 반영
- **주문 상태**(읽기 전용 표시): 신청완료 → 결제완료 → 픽업대기 → 수령완료 등. 이 화면에서는 변경 불가, 주문 관리 화면에서 처리

## 데이터 흐름 (개요)

- 모든 페이지 RSC. `getAuthToken()` + `withToken()` 인증.
- 상세는 회원 정보·주문 요약 `Promise.all` 병렬 페칭. 실패 시 `notFound()`.
- 변경 액션(상태/권한/구매내역/삭제)은 Server Action → Orval API. 성공 시 `revalidatePath` + `router.refresh()`/`router.push()`.
- 토큰 리프레시/에러 핸들링은 mutator가 일괄 처리.
- 필터/페이지네이션/정렬/탭은 URL searchParams 기반 — 북마크/공유 가능.

## 외부 의존

- **인증**: NextAuth (admin 접근 제한)
- **API**: 원격 백엔드 `api.whiskynavi.com` (Orval 코드젠 클라이언트)
- **역할 체계**: 백엔드 ROLE_* 역할 — 커뮤니티 멤버십·비즈니스 사업자 구분의 기준
- **소셜 연동**: Google/Kakao/Naver 연동 여부 — userExt.socialConnections

## 참고

- 역할 필터 구현 계획: `docs/superpowers/plans/...admin-users-role-filters...`
- 코드 구조 탐색: `graphify query "admin users"` / `codegraph_explore "admin/users"`
