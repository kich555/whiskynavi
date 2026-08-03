# 관리자 게시판 관리 — `/admin/boards/*`, `/admin/board-management-history`, `/admin/post-restrictions`

사용자 커뮤니티 게시판과 공지, 게시글 탭(postType), 게시글 삭제 감사 기록, 게시글 작성 제한을 관리자가 관리. 게시판은 권한(역할) 기반으로 읽기/쓰기를 통제하고, 탭(postType)으로 글을 종류별로 분류하며, 공지는 게시판 단위(`BOARD`) 또는 전체(`GLOBAL`)로 노출된다.

## 라우트 맵

| 경로 | 유형 | 비고 |
|---|---|---|
| `/admin/boards` | 게시판 목록 | |
| `/admin/boards/new` | 게시판 신규 등록 폼 | |
| `/admin/boards/[boardId]` | 게시판 상세 + 공지 목록 + 탭(postType) 관리 | ★ 이 화면군 핵심 |
| `/admin/boards/[boardId]/edit` | 게시판 수정 폼 | |
| `/admin/boards/[boardId]/announcements/new` | 공지 신규 등록 폼 | 게시판 공지(BOARD) / 전체 공지(GLOBAL) 선택 |
| `/admin/boards/[boardId]/announcements/[announcementId]/edit` | 공지 수정 폼 | |
| `/admin/board-management-history` | 게시글 삭제 감사 기록 | 특수 — 별도 설명 |
| `/admin/post-restrictions` | 게시글 작성 제한 사용자 목록 | 특수 — 별도 설명. 계정 밴과 별개 |

## 공용 컴포넌트 (admin/_components/)

이 화면군 전반에 쓰이는 공용 UI. 동작 방식 명시.

| 컴포넌트 | 역할 | 동작 |
|---|---|---|
| `AdminHeader` | 상단 헤더(타이틀, 사이드바 토글) | 사이드바 토글은 context. 이 화면군은 검색 미사용(`showSearch={false}`) |
| `Pagination` | URL 기반 페이지네이션 | `router.push(basePath?page=&limit=&...)`. 페이지당 건수 변경 시 page 1로 리셋. 북마크/공유 가능 |
| `DateTimePicker` | 날짜+시각 선택기 | 공지 예약 게시/만료, 게시글 작성 제한 시작/종료 시각 입력에 사용 |

**"목록으로 돌아가기" 버튼 패턴**: 상세·폼 페이지 상단. 이 화면군은 `router.back()`이 아닌 **`router.push()`로 고정 경로 이동** — 브라우저 히스토리와 무관하게 항상 의도한 페이지로 간다.
- 게시판 상세 → `/admin/boards`
- 게시판 수정 → `/admin/boards/[boardId]` (상세로)
- 공지 등록/수정 → `/admin/boards/[boardId]` (상세로, 제출 성공 시에도 동일)

## 페이지별 맥락

### /admin/boards — 게시판 목록

**게시판 테이블** (행 액션으로 이동, 행 전체 클릭은 아님):

| ID | 게시판명 | 슬러그 | 설명 | 활성 | 숨김 | 읽기전용 | 읽기 권한 | 쓰기 권한 | 관리 |
|----|----------|--------|--------|------|------|----------|----------|----------|------|
| 3 | 자유게시판 | free-board | 사용자 자유 글 | ON | 노출 | OFF | 방문자 | 일반회원 | [상세][삭제] |
| 5 | 공지사항 | notice | 운영 공지 | ON | 숨김 | ON | 방문자 | 관리자 | [상세][삭제] |

- **상태 배지 3종**: 활성(ON/OFF), 숨김(숨김/노출), 읽기전용(ON/OFF) — 각각 다른 색상으로 표시
- **권한 라벨**: 읽기/쓰기 권한 역할(ROLE_GUEST, ROLE_USER, ROLE_ADMIN, ROLE_WHISKYNAVI_MEMBER 등 12종)을 한국어 라벨로 변환해 표시
- **행 액션**: 상세(항상), 삭제(활성 트랜지션 중 비활성화)
- **상단 액션**: "게시판 생성" 버튼 → `/admin/boards/new`
- **삭제**: confirm 대화상자 후 Server Action. **게시글이나 공지가 있으면 삭제 불가** — 백엔드가 거부. 성공 시 `router.refresh()`로 목록 갱신
- **페이지네이션**: 기본 20건/페이지, URL 기반

### /admin/boards/new — 게시판 신규 등록

표준 생성 폼. 게시판명, 슬러그(영문 소문자/숫자/하이픈), 설명, 활성/숨김/읽기전용 체크박스, 읽기/쓰기 권한(역할 셀렉트) 입력. 제출 성공 시 Server Action이 `redirect('/admin/boards')`로 목록으로 이동.

### /admin/boards/[boardId] — 게시판 상세 + 공지 + 탭 관리 ★

게시판 1건의 모든 것을 한 화면에서 관리. 이 화면군의 핵심.

**상단 액션바**:
- "게시판 목록으로" → `router.push('/admin/boards')` ⚠️ 공용 패턴(push)
- 수정 → `/admin/boards/[boardId]/edit`
- 삭제 → `deleteBoardAction` Server Action. **게시글/공지 있으면 백엔드가 거부**. 성공 시 `router.push('/admin/boards')` (목록으로)

**섹션 구성** (3컬럼 그리드 + 하단 전체 폭):
1. **기본 정보**(좌측) — ID, 게시판명, 슬러그, 설명, 생성일 + 권한 설정(활성/숨김/읽기전용/읽기권한/쓰기권한)
2. **공지사항**(우측 2컬럼) — 공지 목록 + 등록 버튼
3. **게시판 탭(postType) 관리**(하단 전체 폭) — 탭 목록 + 등록/수정/활성화/기본지정

**공지사항 목록**:

| 범위 배지 | 탭 배지 | 고정 배지 | 제목 | 우선순위 | 예약/만료 | 노출 상태 | 관리 |
|-----------|---------|-----------|------|----------|-----------|-----------|------|
| 전체 | | 고정 | 시스템 점검 안내 | 0 | 예약: 2026.08.05 | 노출 | [수정][삭제] |
| 게시판 | 제품공지 | | 신제품 출시 | 5 | | 숨김 | [수정][삭제] |

- **범위**: `GLOBAL`(전체 공지, 모든 게시판) / `BOARD`(게시판 공지, 이 게시판만)
- **탭 배지**: `BOARD` 공지이고 postType이 지정된 경우에만 표시
- **행 액션**: 수정(`/admin/boards/[boardId]/announcements/[announcementId]/edit`), 삭제(confirm 후 Server Action, `router.refresh()`)
- **상단 액션**: "공지 등록" → `/admin/boards/[boardId]/announcements/new`

**게시판 탭(postType) 목록**:

| 사용처 배지 | 기본 배지 | 이름 | 코드 | 노출순서 | 활성 상태 | 관리 |
|-------------|-----------|------|------|----------|-----------|------|
| 게시글 | 기본 | 자유글 | free | 0 | 활성 | [기본지정][비활성화][수정] |
| 공지 | | 제품공지 | product-notice | 1 | 활성 | [기본지정][활성화][수정] |

- **사용처(usage)**: `POST`(게시글 탭, 사용자가 글을 씀) / `ANNOUNCEMENT`(공지 탭, 관리자 공지 표시). 하나의 탭이 둘 다 사용 중일 수 있음(배지 여러 개)
- **기본(default) 배지**: 기본 글타입 표시. 기본 탭은 비활성화/활성화 버튼이 비활성화됨
- **행 액션**:
  - 기본 지정(★): 비활성 탭은 비활성화 — **비활성 글타입은 기본으로 지정 불가**
  - 활성화/비활성화: 기본 탭은 비활성화
  - 수정: 모달 인라인 수정
- **상단 액션**: "글타입 등록" → 인라인 모달로 생성 폼
- **생성/수정 모달**: 탭 이름, 식별코드(영문 소문자/숫자/하이픈), 종류(POST/ANNOUNCEMENT), 노출순서, 활성 체크박스
  - **코드 중복 검사**: 같은 게시판 내 동일 코드가 있으면 생성/수정 거부
  - **사용처 축소 경고**: 수정 시 usages가 2개 이상인 탭에서 usage를 하나로 바꾸면 경고 표시("저장하면 선택한 종류 하나로 축소됩니다")

### /admin/boards/[boardId]/edit — 게시판 수정

표준 수정 폼. `BoardFormFields` 공유 컴포넌트로 new와 동일 필드. 제출 성공 시 Server Action이 `redirect('/admin/boards')`로 목록으로 이동. (상세가 아닌 목록으로 감)

### /admin/boards/[boardId]/announcements/new — 공지 신규 등록

사용자 화면의 `PostForm`(variant="admin") 재사용 — 제목/내용 입력 + `AnnouncementFormFields` 추가 필드. 제출 성공 시 `router.push('/admin/boards/[boardId]')` (상세로).

**추가 필드**:
- **범위(scope)**: `BOARD`(게시판 공지) / `GLOBAL`(전체 공지)
- **공지 탭(postTypeCode)**: `BOARD`일 때만 활성. usage=ANNOUNCEMENT인 활성 postType만 옵션. `GLOBAL`이면 비활성화 + hidden input 비움 → 서버에서 undefined 처리
- **우선순위**: 숫자가 클수록 상단. 같으면 최신순
- **노출(visible)** / **상단 고정(pinned)**: 체크박스
- **예약 게시(publishedAt)** / **만료(expiredAt)**: DateTimePicker. 예약 시각 전에는 미노출, 만료 시각 후에는 숨김

### /admin/boards/[boardId]/announcements/[announcementId]/edit — 공지 수정

등록과 동일한 폼 구조. 공지 상세는 서버 액션(`getAnnouncementDetailAction`)으로 조회 — 클라이언트에서 토큰을 직접 다루지 않도록 캡슐화. 제출 성공 시 `router.push('/admin/boards/[boardId]')` (상세로).

**수정 시 특이동작**:
- `visible`/`pinned`는 FormData에서 직접 추출(체크박스 미체크 시 필드 자체가 없음). 서버 액션이 FormData.has로 확인

### /admin/board-management-history — 게시글 삭제 감사 기록 ⚠️ 특수

**목적**: 관리자가 삭제한 게시글의 삭제 사유와 메타데이터를 최신순으로 추적. 게시글 삭제(`deleteBoardPostAction`)는 삭제 사유를 필수로 입력받으며(500자 이내), 그 기록이 여기에 누적된다.

**삭제 기록 테이블**:

| 삭제 일시 | 게시판 | 게시글 | 작성자 | 삭제 관리자 | 삭제 사유 |
|-----------|--------|--------|--------|-------------|-----------|
| 2026.08.01 14:32 | 자유게시판 (free-board) | 욕설 게시글 (#1024, 작성 2026.08.01 10:15) | 사용자 #58 | 관리자 #3 (ADMIN) | 욕설성 게시글로 삭제 |
| 2026.07.30 09:00 | 공지사항 (notice) | 중복 공지 (#980, 작성 2026.07.29) | 사용자 #12 | 관리자 #3 (ADMIN) | 중복 공지 정리 |

- **읽기 전용 조회**: 감사 기록만 표시, 편집 불가
- **페이지네이션**: 기본 20건/페이지, URL 기반

**도메인 연결**: 게시글 삭제 액션(`deleteBoardPostAction` in `boards/actions.ts`)이 삭제 사유를 백엔드에 전달하고, `revalidatePath('/admin/boards')` + 사용자 게시판 경로(`/board/{route}`)를 갱신. 그 결과가 이 감사 페이지에 누적됨.

### /admin/post-restrictions — 게시글 작성 제한 ⚠️ 특수

**목적**: 계정 밴과 별개로, 게시글 생성만 선택적으로 제한. 사유 + 기간을 지정해 특정 사용자의 글쓰기를 임시 차단. 기간 만료 시 자동 해제.

**제한 목록 테이블** (활성 제한만 표시 — 종료 시각이 현재 이후인 건만):

| 사용자 | 사유 | 시작 시각 | 종료 시각 | 상태 | 관리 |
|--------|------|-----------|-----------|------|------|
| 홍길동 (hong@example.com) | 홍보성 게시글 반복 | 2026.08.01 00:00 | 2026.08.15 00:00 | 제한 중 | [수정][해제] |
| 김사장 (kim@example.com) | 임시 제한 | 2026.08.05 00:00 | 2026.08.10 00:00 | 예약 | [수정][해제] |

- **상태 배지**: 시작 시각이 미래면 "예약", 현재 진행 중이면 "제한 중"
- **행 액션**: 수정(모달), 해제(confirm 후 `releasePostCreationRestrictionAction`, `router.refresh()`)
- **상단 액션**: "제한 추가" 버튼 → 모달(`PostRestrictionFormModal`)

**제한 추가/수정 모달**:
- **사용자 선택**: 추가 모드일 때 `UserSearchInput`(blacklist 공용 컴포넌트 재사용)으로 검색. 수정 모드일 때는 고정 표시
- **사유**(필수, 1000자 이내), **시작 시각**(필수), **종료 시각**(필수) — DateTimePicker
- **검증**: 제한 기간은 **최소 1시간, 최대 9999년**. Zod superRefine으로 startAt/endAt 간격 검사
- **저장**: `setPostCreationRestrictionAction` → `revalidatePath('/admin/post-restrictions')` + `/admin/users/{userId}` (사용자 상세도 갱신)

**특수 동작**:
- **활성 필터링**: RSC에서 `isPostCreationRestricted=true`로 백엔드 필터링한 사용자 목록을 받되, 클라이언트에서 추가로 종료 시각 > 현재 시각인 건만 표시. `now` 기준은 RSC에서 `new Date().toISOString()`로 전달
- **정렬**: 백엔드 `sort=updatedAt,desc`로 최신 수정순

## 상태 전이 / 예외 로직

### 게시판 삭제 불가 조건
게시글이나 공지가 존재하면 백엔드가 삭제 거부. 클라이언트 confirm 메시지로 사전 안내.

### 공지 범위(scope) 전환
`BOARD → GLOBAL` 전환 시 postTypeCode가 자동으로 undefined 처리(hidden input 비움). `GLOBAL` 공지는 특정 탭에 속할 수 없음. 서버 액션도 `scope === "BOARD" ? postTypeCode : undefined`로 한 번 더 가드.

### 글타입(postType) 기본 지정 제약
비활성 글타입은 기본으로 지정 불가 — 버튼 비활성화 + 툴팁 안내. 기본 글타입은 활성화/비활성화 토글 불가.

### 게시글 작성 제한 기간 검증
최소 1시간, 최대 9999년. 클라이언트 폼 + 서버 액션 양쪽에서 Zod 검증. 시작 시각이 미래면 "예약" 상태로 대기.

## 데이터 흐름 (개요)

- 모든 목록/상세 페이지 RSC. `getAuthToken()` + `withToken()` 인증.
- 상세(`/admin/boards/[boardId]`)는 **부분 내결함성** 페칭 — 게시판 본문은 단독 fetch, 공지/글타입 조회는 `.catch()`로 실패해도 게시판 정보는 표시. 과거 전체 목록 클라이언트 필터링 방식이 백엔드 NPE(500)를 유발해 `notFound()`로 빠지던 버그의 회피.
- 공지 목록은 `BOARD` 스코프(boardId 필터) + `GLOBAL` 스코프를 별도 조회 후 중복 제거하며 합친다.
- 공지 상세 조회는 서버 액션(`getAnnouncementDetailAction`)으로 토큰 캡슐화.
- 변경 액션(생성/수정/삭제/활성화 등)은 Server Action → Orval API. 성공 시 `revalidatePath`로 관련 경로 갱신.
- 토큰 리프레시/에러 핸들링은 mutator가 일괄 처리.
- 페이지네이션은 URL searchParams 기반 — 북마크/공유 가능.

## 외부 의존

- **인증**: NextAuth (admin 접근 제한)
- **API**: 원격 백엔드 `api.whiskynavi.com` (Orval 코드젠 클라이언트)
- **사용자 화면 컴포넌트 재사용**: 공지 등록/수정 폼은 `(main)/board`의 `PostForm`을 admin variant로 재사용
- **사용자 검색**: `blacklist/_components/UserSearchInput`를 post-restrictions에서 재사용
- **역할 체계**: 12종 ROLE(ROLE_GUEST ~ ROLE_PICK_UP_BUSINESS) — 읽기/쓰기 권한 + 커뮤니티 멤버십 구분

## 참고

- 코드 구조 탐색: `graphify query "admin boards"` / `codegraph_explore "admin/boards"`
- 사용자 게시판 화면: `/(main)/board/*` (이 문서 범위 밖)
