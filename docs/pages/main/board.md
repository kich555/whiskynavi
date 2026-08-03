# 사용자 게시판 — `/board/community/*`, `/board/news/*`

사용자 화면(main 그룹). 커뮤니티 게시판과 뉴스 게시판은 동일 구조를 공유하며, 차이는 글쓰기 권한과 board 식별자뿐이다. 두 게시판 모두 게시글(POST)과 공지(ANNOUNCEMENT)를 탭으로 전환하며, 게시글은 댓글/대댓글을 지원한다.

## 라우트 맵

| 경로 | 유형 | 비고 |
|---|---|---|
| `/board/community` | 게시글/공지 목록 | community 게시판 |
| `/board/community/posts/[id]` | 게시글 상세 + 댓글 | ★ 이 화면군 핵심 |
| `/board/community/posts/new` | 게시글 신규 작성 폼 | 로그인 필요, 작성 제한 시 제한 안내만 노출 |
| `/board/community/posts/[id]/edit` | 게시글 수정 폼 | 본인 글만, 타인 글이면 상세로 강제 리다이렉트 |
| `/board/community/announcements/[id]` | 공지 상세 | 읽기 전용 |
| `/board/news` | 게시글/공지 목록 | news 게시판 — 구조는 community와 동일 |
| `/board/news/posts/[id]` | 게시글 상세 + 댓글 | community와 동일 |
| `/board/news/posts/new` | 게시글 신규 작성 폼 | 글쓰기는 admin/super_admin만 (아래 특수 동작) |
| `/board/news/posts/[id]/edit` | 게시글 수정 폼 | community와 동일 |
| `/board/news/announcements/[id]` | 공지 상세 | community와 동일 |

community와 news는 board 식별자(`"community"` / `"news"`)만 다르하고 모든 페이지 로직이 동일하다. 이하 community 기준으로 서술하고, news만의 차이점을 명시한다.

## 공용 컴포넌트 (`board/_components/`)

이 화면군 전반에 쓰이는 공용 UI. 동작 방식 명시.

| 컴포넌트 | 역할 | 동작 |
|---|---|---|
| `BoardContent` | 목록 페이지 전체 (탭 + 목록 + 검색) | 탭 전환/페이지 이동은 `router.push(URL)` — tab, page, searchType, keyword를 searchParams에 인코딩. 북마크/공유 가능 |
| `PostList` | 게시글/공지 목록 렌더링 | 데스크탑은 테이블, 모바일은 카드 리스트. 고정 공지 펼치기/접기 토글은 클라이언트 state |
| `PostItem` | 게시글 행/카드 | `<Link>`로 상세로 이동. `prefetch={false}`. `contentVisibility: auto`로 오프스크린 렌더 최적화 |
| `AnnouncementItem` | 공지 행/카드 | 클릭 시 `/board/[boardId]/announcements/[id]`로 이동 |
| `PostDetailShell` | 상세 페이지 공통 레이아웃 | "← 목록으로" 링크는 `<a href>` (서버 사이드 이동). header/content/actions를 props로 주입 |
| `PostForm` | 게시글 작성/수정 폼 | TipTap 리치텍스트 에디터. 이미지 업로드 지원. variant로 user/admin 테마 전환 (사용자 화면은 항상 "user") |
| `CommentsSection` | 댓글 영역 전체 | 로그인 시 댓글 작성 폼 노출, 미로그인 시 안내 메시지 |
| `CommentForm` | 댓글 작성/수정 폼 | 작성 모드: 성공 시 폼 초기화. 수정 모드: 성공 시 폼 닫기(onCancel) |
| `CommentItem` | 댓글 1건 + 대댓글 | 작성자만 수정/삭제 버튼 노출. 최상위 댓글만 "답글" 버튼 (1단계 대댓글만 허용) |
| `AdminAuthorBadge` | 관리자 작성자 배지 | 읽기 전용 표시 |
| `AdminPostDeleteDialog` | 관리자 게시글 삭제 다이얼로그 | 사유 입력 필수. 삭제 후 `router.push(목록)` + `router.refresh()` |
| `AdminPostTypeChangeDialog` | 관리자 게시글 분류 변경 다이얼로그 | POST usage postType만 선택 가능. 변경 후 `router.refresh()` |

**"← 목록으로" 버튼 패턴**: 상세/폼 페이지 상단. `PostDetailShell`과 `PostForm` 모두 `<a href>` 링크 사용 — `router.back()`이 아님. 이전 히스토리가 없어도 항상 해당 게시판 목록으로 안전하게 이동. 링크 href는 페이지에서 `/board/[boardId]`로 전달.

## 페이지별 맥락

### /board/community — 게시글/공지 목록

탭 기반으로 게시글(POST)과 공지(ANNOUNCEMENT)를 전환하며, 각각 페이지네이션과 검색을 지원한다.

**탭 구성**:
- 게시판 메타데이터(`getBoard`)의 postType 목록에서 탭을 동적 생성
- 항상 첫 탭은 "전체"(타입 필터 없는 게시글 목록)
- POST usage postType → 게시글 탭, ANNOUNCEMENT usage postType → 공지 탭
- 둘 다 가진 postType은 공지 탭으로 라우팅 (공지 우선)

**게시글 탭 (POST)**:
- 게시글 + 고정 공지 배너를 `Promise.all` 병렬 페칭
- 고정 공지는 최대 3건(PINNED_ANNOUNCEMENT_COUNT), 전체 공지는 최대 100건(ALL_ANNOUNCEMENT_PAGE_SIZE) 조회
- 정렬: `createdAt,desc` (API가 viewCount 정렬 미지원)
- 페이지당 10건(POSTS_PER_PAGE)

**공지 탭 (ANNOUNCEMENT)**:
- 공지만 페이지네이션 조회 (고정 공지 배너 없음, 게시글 영역 공백)

**게시글 테이블** (데스크탑 — 행 클릭 = `/board/[boardId]/posts/[id]` 이동):

| 분류 | 제목 | 작성자 | 조회수 | 날짜 |
|------|------|--------|--------|------|
| 자유 | 글렌피딕 시음 후기 [3] | 홍길동 | 142 | 2시간 전 |
| 질문 | 초보 추천 위스키? [12] | 김위스키 | 89 | 2026.08.01 |

- 제목에 이미지 첨부 아이콘, 댓글 수 표시
- 날짜는 상대 시간(방금 전 / N시간 전 / 어제 / 월일)으로 표시
- 관리자 작성자는 배지 표시

**고정 공지 영역** (게시글 탭 상단):
- 최대 3건의 pinned 공지를 배너 형태로 표시
- 전체 공지가 3건 초과 시 "▽ 공지 전체보기 (N개)" 토글 버튼 — 클라이언트 state로 펼치기/접기

**모바일 동작** (특수):
- 데스크탑 페이지네이션 대신 "더보기" 버튼
- 최대 5회(LOAD_MORE_MAX_CLICKS)까지 더보기 클릭 가능, 이후에는 페이지네이션으로 전환
- 더보기는 클라이언트에서 API 호출 후 누적 목록에追加 — 탭 전환 중 응답이 돌아오면 tabRef 비교로 버림 (탭 간 데이터 오염 방지)
- 더보기/페이지네이션 표시 조건: 게시글 탭 + 모바일 + 남은 페이지 + 더보기 가능 횟수

**검색** (게시글 탭만):
- 검색 조건: 제목 / 작성자 (select 박스)
- GET 폼 제출 — `searchType`, `keyword`, `tab`, `page=1`을 searchParams로 전송
- 검색어 삭제(X) 버튼 → `router.push(tab+page만 포함, 검색 조건 제외)`
- 공지 탭에서는 검색 폼 미노출

**상단 액션**:
- "글쓰기" 버튼 — 게시글 탭에서만, `canWritePost` 권한이 있을 때만 노출. `/board/[boardId]/posts/new`로 이동
- 공지 탭에서는 글쓰기 버튼 미노출 (공지는 admin 페이지에서만 등록)

**작성 제한 안내**:
- `getActivePostCreationRestriction`으로 사용자의 게시글 작성 제한 여부 확인
- 제한 중이면 글쓰기 버튼 비활성화 + 제한 안내 컴포넌트 상단 노출 (사유, 기간 표시)

### /board/community/posts/[id] — 게시글 상세 + 댓글 ★

게시글 본문 + 댓글/대댓글을 한 화면에서 관리. 이 화면군의 핵심.

**데이터 페칭** (RSC, 병렬):
- 게시글 조회 + 조회수 증가(`postApiBoardsBoardidPostsPostidViews`) — 실패 시 `notFound()`
- 댓글 목록 조회 — 실패해도 null 처리 (댓글 영역만 빈 상태)
- 관리자 접속 시에만 게시판 메타데이터(postType 목록) 추가 페칭 — 분류 변경 다이얼로그용

**상단 액션바** (작성자 또는 관리자에게만 노출):
- "← 목록으로" → `/board/[boardId]` 링크 (공용 패턴)
- **작성자**: 수정 링크(`/board/[boardId]/posts/[id]/edit`) + 삭제 버튼
  - 삭제: `confirm()` 후 `deletePostAction` Server Action. 성공 시 `redirect(목록)` (Server Action 내부)
- **관리자**(작성자 아님): 분류 변경 다이얼로그 + 관리자 삭제 다이얼로그
  - 분류 변경: POST usage postType만 선택 가능. 변경 후 `router.refresh()`
  - 관리자 삭제: 사유 입력 필수(최대 500자). 삭제 후 `router.push(목록)` + `router.refresh()`. 감사 기록 보존
- 작성자이면서 관리자인 경우: 작성자 액션(수정/삭제) 우선

**본문**: TipTap HTML을 `dangerouslySetInnerHTML`로 렌더링. 이미지/링크 스타일 포함.

**댓글 영역**:
- 댓글 수(최상위 + 대댓글 합산) 표시
- 로그인 시: 최상위 댓글 작성 폼 노출. 미로그인 시: "댓글을 작성하려면 로그인이 필요합니다" 안내
- 댓글 1건: 작성자, 작성일, 수정표시(수정 시), 본문, 액션 버튼
  - 작성자만 수정/삭제 버튼 노출
  - 최상위 댓글만 "답글" 버튼 — 1단계 대댓글만 허용 (대댓글에 답글 버튼 없음)
  - 수정: 인라인 폼 전환. 성공 시 폼 닫기
  - 삭제: `confirm()` 후 `deleteCommentAction`. 성공 시 `revalidatePath`로 자동 갱신
  - 대댓글 작성: 부모 댓글 하단에 인라인 폼. 성공 시 폼 초기화
- 댓글 없을 시: "아직 댓글이 없습니다. 첫 댓글을 남겨보세요." 안내

**권한 분기**:
- `isAuthor` (currentUserId === post.authorId): 수정/삭제
- `isAdmin` (세션 roles에 admin/super_admin): 분류 변경/관리자 삭제
- 둘 다 아님: 액션 영역 없음 (읽기 전용)

### /board/community/posts/new — 게시글 신규 작성

- 미로그인 시 `redirect("/sign-in?callbackUrl=...")`
- 작성 제한 중이면 제한 안내만 노출 (폼 미노출)
- 폼 제출: `createPostAction` Server Action. 성공 시 `router.replace(목록)` (useEffect로 success 감지)
- 폼 구성: 분류(select), 제목(input), 내용(TipTap 에디터)
- 분류 옵션: POST usage postType만

**TipTap 에디터 기능**:
- 굵게/기울임/취소선, 제목2/제목3, 글머리/번호 목록, 링크 추가/제거, 이미지 추가
- 이미지 업로드: 클립보드 붙여넣기 또는 파일 선택. JPG/PNG/WEBP, 이미지당 최대 5MB
- 업로드 시 blob URL로 즉시 삽입 → 완료 시 실제 URL로 교체. 실패 시 blob URL 유지(깨진 이미지)
- 링크 붙여넣기: URL 패턴 감지 시 자동으로 링크 마크 적용
- submit 시 에디터 HTML을 hidden input에 설정하여 전송

### /board/community/posts/[id]/edit — 게시글 수정

- 미로그인 시 sign-in으로 리다이렉트
- **본인 글만 수정 가능**: `post.authorId !== session.user.id`이면 `redirect(상세)`로 강제 리다이렉트
- 게시글 조회 실패 시 `notFound()`
- 폼 제출: `updatePostAction` Server Action. 성공 시 `redirect(상세)` (Server Action 내부에서 revalidatePath + redirect)
- 기본값: 기존 제목, 내용, 분류 코드

### /board/community/announcements/[id] — 공지 상세

- 읽기 전용. "← 목록으로" 링크 + 공지 배지 + 제목 + 작성일 + 본문만 표시
- 액션 영역 없음 (사용자는 공지 수정/삭제 불가)
- 공지 조회 실패 시 `notFound()`

### /board/news — 뉴스 게시판 목록 ⚠️ community와 동일 구조

모든 로직이 community와 동일하다. 유일한 차이:

**글쓰기 권한**:
- community: 로그인 사용자이고 작성 제한이 없으면 `canWritePost = true`
- **news: admin/super_admin 역할이고 작성 제한이 없으면 `canWritePost = true`** — 일반 사용자는 글쓰기 버튼이 노출되지 않음

news의 나머지 라우트(`/posts/[id]`, `/posts/new`, `/posts/[id]/edit`, `/announcements/[id]`)는 community와 완전히 동일한 컴포넌트와 Server Action을 사용한다. board 식별자만 `"news"`로 교체.

## 상태 전이 / 강제 리다이렉트 / 비활성화 조건

| 조건 | 동작 |
|------|------|
| 게시글 작성 페이지 미로그인 | `redirect("/sign-in?callbackUrl=...")` |
| 게시글 수정 페이지 타인 글 | `redirect(상세)` 강제 리다이렉트 |
| 게시글/공지 조회 실패 | `notFound()` |
| 작성 제한 중 | 글쓰기 버튼 비활성화 + 제한 안내 노출. new 페이지는 폼 대신 안내만 |
| 게시글 삭제 (작성자) | `confirm()` → Server Action → `redirect(목록)` |
| 게시글 삭제 (관리자) | 사유 입력 필수 → Server Action → `router.push(목록)` + `refresh()` |
| 게시글 수정 성공 | Server Action 내 `revalidatePath(상세)` + `redirect(상세)` |
| 댓글 수정 성공 | 인라인 폼 닫기 (useEffect로 success 감지) |
| 댓글 작성 성공 | 폼 초기화 (다음 댓글 입력 대기) |
| 분류 변경 성공 | `router.refresh()` (현재 페이지 갱신) |
| 이미지 업로드 중 | submit 버튼 비활성화 |
| 더보기 최대 클릭 도달 | 더보기 버튼 → 페이지네이션으로 전환 |

## 데이터 흐름 (개요)

- 모든 목록/상세 페이지 RSC. `getAuthToken()` + `withToken()` 인증.
- 목록 페이지: session + 게시판 메타데이터 + 현재 사용자 정보를 `Promise.all` 병렬 페칭. 게시글 탭은 게시글 + 전체 공지를 추가 병렬 페칭.
- 상세 페이지: 게시글(조회수 증가 포함) + 댓글 + (관리자만) 게시판 메타데이터를 `Promise.all` 병렬 페칭.
- 변경 액션(게시글 생성/수정/삭제, 댓글 생성/수정/삭제)은 Server Action → Orval API.
- Server Action 내부에서 인증 재검증(`getAuthToken`) + 작성자 확인(defense-in-depth) 수행.
- 게시글 내용은 `sanitizeRichTextContent`로 XSS 필터링 후 저장. `hasImage` 플래그를 본문에서 이미지 존재 여부로 자동 계산.
- 토큰 리프레시/에러 핸들링은 mutator가 일괄 처리.
- 탭/페이지네이션/검색은 URL searchParams 기반 — 북마크/공유 가능.

## 외부 의존

- **인증**: NextAuth (세션 기반, `getServerSession` / `getAuthToken`)
- **API**: 원격 백엔드 `api.whiskynavi.com` (Orval 코드젠 클라이언트)
- **리치텍스트**: TipTap (StarterKit + Image + Link + Placeholder 확장)
- **이미지 업로드**: `postApiBoardsUploads` (백엔드 업로드 API)
- **관리자 액션**: `@/app/admin/boards/actions`의 `deleteBoardPostAction`, `changeBoardPostTypeAction` — 사용자 화면에서 관리자 권한으로 호출

## 참고

- 코드 구조 탐색: `graphify query "board community posts"` / `codegraph_explore "(main)/board"`
- 관리자 게시판 관리: `docs/pages/admin/` (공지 등록, 게시판 설정)
