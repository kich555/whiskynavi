# 사용자 게시판 UI 설계

**날짜**: 2026-06-14  
**범위**: 사용자 게시판 (`/community`) — 게시글 목록/상세/작성/수정/삭제, 이미지 첨부  
**어드민 게시판 관리 UI는 별도 스펙으로 진행**

---

## 1. 요구사항 요약

- 게시판은 단일 운영 (boardId 상수 고정)
- 탭: **공지 · 일반 · 인기** (URL `?tab=general|popular|announcement`)
- 일반/인기 탭: 공지 최대 3개 상단 고정 표시
- 공지 탭: 공지글만 표시
- 인증: 게시판 `writeRole` 기반 동적 처리 (로그인 여부 + 역할 검증)
- 에디터: 심플 텍스트 (제목 + textarea) + 이미지 첨부
- 이미지: S3 Presigned PUT → 마크다운 URL 삽입, `react-markdown` 렌더링
- 페이지네이션: 모바일(더보기 ×5 → 페이지 이동), 데스크탑(URL 기반)

---

## 2. 라우트 구조

```
src/app/(main)/community/
├── page.tsx                          # RSC — 고정 boardId로 데이터 fetch
├── loading.tsx
├── _components/
│   ├── BoardContent.tsx              # "use client" — 탭/페이지 URL 제어
│   ├── BoardTabs.tsx                 # 공지·일반·인기 탭 (URL 기반)
│   ├── PostList.tsx                  # 공지 고정 3개 + 게시글 목록
│   ├── PostItem.tsx                  # 게시글 행 (모바일 카드 / 데스크탑 테이블 행)
│   ├── AnnouncementItem.tsx          # 공지 행 (앰버 배경, 공지 뱃지)
│   └── LoadMorePagination.tsx        # 모바일/데스크탑 분기 페이지네이션
├── posts/
│   ├── new/
│   │   ├── page.tsx                  # 로그인/권한 체크 후 폼 렌더
│   │   └── _components/
│   │       ├── PostCreateContent.tsx # "use client" — useActionState
│   │       └── PostForm.tsx          # 공유 폼 컴포넌트 (create/edit 공용)
│   └── [postId]/
│       ├── page.tsx                  # RSC — 게시글 상세 fetch
│       ├── loading.tsx
│       ├── _components/
│       │   └── PostDetailContent.tsx # "use client" — 삭제 처리
│       └── edit/
│           ├── page.tsx              # 본인 글 체크 후 폼 렌더
│           └── _components/
│               └── PostEditContent.tsx  # "use client" — useActionState
└── actions.ts                        # createPost, updatePost, deletePost
```

---

## 3. 상수 및 설정

```ts
// src/app/(main)/community/_lib/constants.ts
export const COMMUNITY_BOARD_ID = Number(process.env.NEXT_PUBLIC_COMMUNITY_BOARD_ID ?? 1);
export const POSTS_PER_PAGE = 10;
export const LOAD_MORE_MAX_CLICKS = 5; // 모바일 더보기 최대 횟수
export const MAX_IMAGE_COUNT = 5;
export const MAX_IMAGE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PINNED_ANNOUNCEMENT_COUNT = 3;
```

---

## 4. searchParams 설계

| 파라미터 | 허용값 | 기본값 |
|---|---|---|
| `tab` | `general` \| `popular` \| `announcement` | `general` |
| `page` | 정수 ≥ 1 | `1` |

---

## 5. 데이터 fetch 전략 (RSC)

`page.tsx`에서 `searchParams`를 받아 병렬 fetch:

```ts
// tab === 'announcement'
const announcements = await getApiBoardsBoardidAnnouncements(COMMUNITY_BOARD_ID, { page, size: POSTS_PER_PAGE })

// tab === 'general' | 'popular'
const [posts, pinnedAnnouncements] = await Promise.all([
  getApiBoardsBoardidPosts(COMMUNITY_BOARD_ID, {
    page,
    size: POSTS_PER_PAGE,
    sort: tab === 'popular' ? ['viewCount,desc'] : ['createdAt,desc'], // 구현 시 PostResponse에 viewCount 필드 존재 여부 확인
  }),
  getApiBoardsBoardidAnnouncements(COMMUNITY_BOARD_ID, { page: 0, size: PINNED_ANNOUNCEMENT_COUNT }),
])
```

데이터는 `BoardContent` 클라이언트 컴포넌트에 props로 전달.

---

## 6. 탭 및 페이지네이션 로직

### BoardContent (client)

- `router.push`로 `?tab=...&page=...` URL 업데이트 → RSC 재실행
- 탭 전환 시 `page` 초기화

### LoadMorePagination (client)

```
모바일 (useIsMobile hook, breakpoint: Tailwind md = 768px):
  - 초기 데이터 10개 표시
  - "더보기" 클릭 → page+1 fetch → 기존 목록에 append (useState 누적)
  - 클릭 횟수 === LOAD_MORE_MAX_CLICKS(5) 도달 시:
    → "더보기" 버튼 숨김
    → URL 기반 페이지네이션 버튼 표시 (1,2,3...)

데스크탑:
  - URL 기반 페이지네이션만 (router.push ?page=N)
```

모바일 더보기 버튼 스타일: `backdrop-blur-md bg-white/55` glassmorphism floating 효과, 리스트 하단 fade-out gradient와 함께 표시.

---

## 7. 이미지 첨부 (PostForm)

### 업로드 플로우

```
① 파일 선택 (input[type=file])
   → 클라이언트 사전 검증 (타입, 5MB 이하)
   → URL.createObjectURL()로 미리보기

② getApiS3Presigned({ key: `community/${uuid}/${filename}`, filename })
   → presigned PUT URL 반환

③ fetch(presignedUrl, { method: 'PUT', body: file })
   → S3 직접 업로드 (서버 미경유)

④ 썸네일 클릭 시 textarea 커서 위치에 삽입
   → `![](https://cdn.whiskynavi.com/community/{uuid}/{filename})`
```

### useImageUpload 훅

```ts
// src/app/(main)/community/_hooks/useImageUpload.ts
// 상태: files (UploadedImage[]), upload(file), remove(id), insertToContent(id, textareaRef)
// 최대 MAX_IMAGE_COUNT(5)장 제한
// 업로드 중 스피너, 실패 시 에러 표시
```

### 렌더링

- `PostDetailContent`에서 `react-markdown` 사용
- content 내 `![alt](url)` → `<img>` 렌더링 (글 사이사이 인라인 표시)
- XSS 방지: `rehype-sanitize` 플러그인 적용

---

## 8. Server Actions (`actions.ts`)

```ts
// FormState: { success: boolean; error?: string; values?: Record<string, string> }

createPostAction(_prev: FormState, formData: FormData): Promise<FormState>
  → postApiBoardsBoardidPosts(COMMUNITY_BOARD_ID, { title, content })
  → 성공 시 revalidatePath('/community') + redirect('/community')

updatePostAction(postId: number, _prev: FormState, formData: FormData): Promise<FormState>
  → putApiBoardsBoardidPostsPostid(COMMUNITY_BOARD_ID, postId, { title, content })
  → 성공 시 revalidatePath('/community/posts/[postId]') + redirect('/community/posts/[postId]')

deletePostAction(postId: number): Promise<{ success: boolean; error?: string }>
  → deleteApiBoardsBoardidPostsPostid(COMMUNITY_BOARD_ID, postId)
  → 성공 시 revalidatePath('/community') + redirect('/community')
```

Zod 검증: `title` (1~200자), `content` (1자 이상, trim 후)

---

## 9. 인증 및 권한 처리

- `getAuthToken()` + `getSession()` 으로 현재 사용자 확인
- 게시글 목록/상세: 누구나 접근 가능
- 글쓰기 버튼: `board.writeRole` + 세션 기반 표시 여부 결정
- 글쓰기/수정 페이지 접근: 비로그인 시 `/sign-in?callbackUrl=...` 리다이렉트
- 수정/삭제 버튼: `post.authorId === session.user.id` 일 때만 표시
- Server Action 내부에서도 인증 재검증

---

## 10. 에러 처리

| 상황 | 처리 |
|---|---|
| 폼 유효성 실패 | `FormState.error` → `<FormMessage>` 표시, 입력값 유지 |
| API 에러 | `getUserErrorMessage()` 래핑 → toast (sonner) |
| 이미지 업로드 실패 | 썸네일에 에러 오버레이, 해당 이미지 제외 후 폼 제출 허용 |
| 권한 없음 | 403 → "권한이 없습니다" toast |
| 게시글 없음 | 404 → `/community` 리다이렉트 |
| 이미지 타입/크기 초과 | 클라이언트 즉시 차단, 인라인 에러 메시지 |

---

## 11. UI 컴포넌트 스타일 가이드

- 색상: amber-600 (primary), red-600 (destructive) — 기존 admin 패턴 동일
- 공지 뱃지: `bg-amber-600 text-white text-xs px-1.5 py-0.5 rounded`
- 공지 행 배경: `bg-amber-50 border-amber-200`
- 더보기 버튼: `backdrop-blur-md bg-white/55 border border-white/70` (glassmorphism)
- 리스트 하단 fade: `bg-gradient-to-b from-transparent to-white/60`
- 기존 `src/components/ui/` 컴포넌트 우선 사용 (Button, Input, Textarea, Dialog 등)

---

## 12. 제외 범위 (이번 스펙 밖)

- 댓글 기능 (API 미존재)
- 어드민 게시판 관리 UI (별도 스펙)
- 게시글 좋아요/신고
- 이미지 리사이징/CDN 최적화
