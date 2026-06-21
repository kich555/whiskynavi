# 사용자 게시판 UI 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/community` 경로에 사용자 게시판 UI 구축 — 게시글 목록/상세/작성/수정/삭제, 공지 3개 고정, 이미지 첨부, 모바일/데스크탑 페이지네이션

**Architecture:** 기존 admin RSC → Client 패턴 동일. `page.tsx`(RSC)가 searchParams 기반으로 데이터 fetch 후 `BoardContent`(client)에 props 전달. URL 기반으로 탭(`?tab=general|popular|announcement`)과 페이지(`?page=N`)를 제어. 이미지는 S3 Presigned URL로 클라이언트 직접 업로드 후 마크다운 URL을 content에 삽입.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui, react-markdown + rehype-sanitize, Zod(v4), useActionState, overlay-kit

**사전 설치:**
```bash
pnpm add react-markdown remark-gfm rehype-sanitize
```

## Global Constraints

- 기존 `src/components/ui/` 컴포넌트 우선 사용 (Button, Input, Textarea, Dialog, FormMessage)
- 색상: amber-600 (primary), red-600 (destructive)
- Server Action: `{ success: boolean; error?: string; values?: Record<string, string> }` FormState 패턴
- `parseApiPage()` / `toDisplayPage()` 등 `src/lib/page-response.ts` 유틸 사용
- `getUserErrorMessage()`으로 API 에러 메시지 래핑
- `withToken(await getAuthToken())` 패턴으로 API 호출 인증
- `getServerSession(authOptions)`으로 서버에서 세션 확인

---

## 파일 구조

```
src/app/(main)/community/
├── page.tsx                               # RSC: 데이터 fetch + BoardContent에 전달
├── loading.tsx                            # Suspense fallback
├── _lib/
│   └── constants.ts                       # BOARD_ID, 페이지네이션 설정 등
├── _components/
│   ├── BoardContent.tsx                   # "use client": 탭/페이지 URL 제어 + 모바일/데스크탑 분기
│   ├── BoardTabs.tsx                      # 공지·일반·인기 탭
│   ├── PostList.tsx                       # 공지 3개 고정 + 게시글 목록 렌더링
│   ├── PostItem.tsx                       # 게시글 행 (모바일 카드형 / 데스크탑 테이블 행)
│   ├── AnnouncementItem.tsx               # 공지 행 (앰버 배경, 공지 뱃지)
│   ├── LoadMorePagination.tsx             # 모바일: 더보기(×5) → 페이지 이동 / 데스크탑: URL 페이지네이션
│   └── PostCardList.tsx                   # 모바일 카드형 목록 렌더러
├── _hooks/
│   └── useIsMobile.ts                     # Tailwind md(768px) 기준 모바일 감지
├── posts/
│   ├── new/
│   │   ├── page.tsx                       # RSC: 로그인 체크 + PostCreateContent 렌더
│   │   └── _components/
│   │       ├── PostCreateContent.tsx       # "use client": useActionState
│   │       └── PostForm.tsx               # 공용 폼 (create/edit), 이미지 업로드 포함
│   └── [postId]/
│       ├── page.tsx                       # RSC: 게시글 상세 fetch
│       ├── loading.tsx
│       ├── _components/
│       │   └── PostDetailContent.tsx      # "use client": react-markdown 렌더 + 삭제
│       └── edit/
│           ├── page.tsx                   # RSC: 본인 글 확인 + PostEditContent
│           └── _components/
│               └── PostEditContent.tsx    # "use client": useActionState
└── actions.ts                             # Server Actions
```

---

### Task 1: 상수

**Files:**
- Create: `src/app/(main)/community/_lib/constants.ts`

**Interfaces:**
- Consumes: API 타입들 (`PostSummaryResponse`, `UserAnnouncementSummaryResponse`)
- Produces: `COMMUNITY_BOARD_ID`, `POSTS_PER_PAGE`, `LOAD_MORE_MAX_CLICKS`, `MAX_IMAGE_COUNT`, `MAX_IMAGE_SIZE_MB`, `ALLOWED_IMAGE_TYPES`, `PINNED_ANNOUNCEMENT_COUNT`

> **bundle-barrel-imports:** barrel 파일(`index.ts` re-export)을 만들지 않습니다. 각 consumer가 직접 `./_lib/constants`에서 import하면 번들 크기와 빌드 성능에 유리합니다.

- [ ] **Step 1: Create constants file**

```ts
// src/app/(main)/community/_lib/constants.ts
export const COMMUNITY_BOARD_ID = Number(process.env.NEXT_PUBLIC_COMMUNITY_BOARD_ID ?? 1);
export const POSTS_PER_PAGE = 10;
export const LOAD_MORE_MAX_CLICKS = 5;
export const MAX_IMAGE_COUNT = 5;
export const MAX_IMAGE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PINNED_ANNOUNCEMENT_COUNT = 3;
```

> **참고:** barrel 파일(`index.ts`)을 별도로 만들지 않습니다. import 시 `from "./_lib/constants"`로 직접 접근합니다.

- [ ] **Step 2: Commit**

```bash
git add src/app/(main)/community/_lib/
git commit -m "feat: add community board constants"
```

---

### Task 2: useIsMobile 훅

**Files:**
- Create: `src/app/(main)/community/_hooks/useIsMobile.ts`

**Interfaces:**
- Produces: `useIsMobile(): boolean` — Tailwind md(768px) 기준, SSR-safe

- [ ] **Step 1: Create hook**

```ts
// src/app/(main)/community/_hooks/useIsMobile.ts
"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;

function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(main)/community/_hooks/useIsMobile.ts
git commit -m "feat: add useIsMobile hook for community board"
```

---

### Task 3: Server Actions (createPost, updatePost, deletePost)

**Files:**
- Create: `src/app/(main)/community/actions.ts`

**Interfaces:**
- Consumes: `COMMUNITY_BOARD_ID` (constants), `postApiBoardsBoardidPosts`, `putApiBoardsBoardidPostsPostid`, `deleteApiBoardsBoardidPostsPostid` (API), `getAuthToken()` / `withToken()` (auth), `getUserErrorMessage()` (errors), `revalidatePath` / `redirect` (next/navigation)
- Produces: `FormState`, `createPostAction`, `updatePostAction`, `deletePostAction`

- [ ] **Step 1: Write the actions file**

```ts
// src/app/(main)/community/actions.ts
"use server";

import {
  deleteApiBoardsBoardidPostsPostid,
  postApiBoardsBoardidPosts,
  putApiBoardsBoardidPostsPostid,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { getUserErrorMessage } from "@/apis/errors";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { COMMUNITY_BOARD_ID } from "./_lib/constants";

export type FormState = {
  success: boolean;
  error?: string;
  values?: Record<string, string>;
};

const postSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해주세요.")
    .max(200, "제목은 최대 200자까지 입력 가능합니다."),
  content: z
    .string()
    .trim()
    .min(1, "내용을 입력해주세요."),
});

export async function createPostAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values: Record<string, string> = {
    title: (formData.get("title") as string) ?? "",
    content: (formData.get("content") as string) ?? "",
  };

  const token = await getAuthToken();
  if (!token) {
    return { success: false, error: "로그인이 필요합니다.", values };
  }

  const parsed = postSchema.safeParse(values);
  if (!parsed.success) {
    const firstMessage = parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
    return { success: false, error: firstMessage, values };
  }

  try {
    await postApiBoardsBoardidPosts(
      COMMUNITY_BOARD_ID,
      { title: parsed.data.title, content: parsed.data.content },
      withToken(token),
    );
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "게시글 작성에 실패했습니다."),
      values,
    };
  }

  revalidatePath("/community");
  redirect("/community");
}

export async function updatePostAction(postId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const values: Record<string, string> = {
    title: (formData.get("title") as string) ?? "",
    content: (formData.get("content") as string) ?? "",
  };

  const token = await getAuthToken();
  if (!token) {
    return { success: false, error: "로그인이 필요합니다.", values };
  }

  const parsed = postSchema.safeParse(values);
  if (!parsed.success) {
    const firstMessage = parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
    return { success: false, error: firstMessage, values };
  }

  try {
    await putApiBoardsBoardidPostsPostid(
      COMMUNITY_BOARD_ID,
      postId,
      { title: parsed.data.title, content: parsed.data.content },
      withToken(token),
    );
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "게시글 수정에 실패했습니다."),
      values,
    };
  }

  revalidatePath(`/community/posts/${postId}`);
  redirect(`/community/posts/${postId}`);
}

export async function deletePostAction(postId: number): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();
  if (!token) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  try {
    await deleteApiBoardsBoardidPostsPostid(COMMUNITY_BOARD_ID, postId, withToken(token));
    revalidatePath("/community");
    redirect("/community");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "게시글 삭제에 실패했습니다."),
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(main)/community/actions.ts
git commit -m "feat: add community post server actions"
```

---

### Task 4: 게시판 목록 페이지 (RSC page.tsx)

**Files:**
- Create: `src/app/(main)/community/page.tsx`
- Create: `src/app/(main)/community/loading.tsx`

**Interfaces:**
- Consumes: `getApiBoardsBoardidPosts`, `getApiBoardsBoardidAnnouncements`, `getApiBoards` (API), `COMMUNITY_BOARD_ID` (constants), `parseApiPage`, `withToken`, `getAuthToken`
- Produces: 초기 props를 `BoardContent`에 전달

- [ ] **Step 1: Create loading.tsx**

```tsx
// src/app/(main)/community/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Skeleton className="mb-6 h-8 w-24" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create page.tsx**

```tsx
// src/app/(main)/community/page.tsx
import {
  getApiBoardsBoardidAnnouncements,
  getApiBoardsBoardidPosts,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseApiPage } from "@/lib/page-response";
import BoardContent from "./_components/BoardContent";
import { COMMUNITY_BOARD_ID, POSTS_PER_PAGE, PINNED_ANNOUNCEMENT_COUNT } from "./_lib/constants";

interface CommunityPageProps {
  searchParams: Promise<{
    tab?: string;
    page?: string;
  }>;
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const params = await searchParams;
  const tab = params.tab ?? "general";
  const page = parseApiPage(params.page);

  // async-parallel: session + token 독립적이므로 병렬 fetch
  const [session, token] = await Promise.all([
    getServerSession(authOptions),
    getAuthToken(),
  ]);

  // 현재 사용자 ID (비로그인 시 undefined)
  const currentUserId = session?.user?.id ? Number(session.user.id) : undefined;

  if (tab === "announcement") {
    const announcementsRes = await getApiBoardsBoardidAnnouncements(
      COMMUNITY_BOARD_ID,
      { page, size: POSTS_PER_PAGE },
      token ? { headers: withToken(token).headers } : undefined,
    );

    return (
      <BoardContent
        tab={tab}
        currentPage={Number(params.page) || 1}
        currentUserId={currentUserId}
        initialPosts={[]}
        initialAnnouncements={announcementsRes.data.content ?? []}
        totalElements={announcementsRes.data.page?.totalElements ?? 0}
        totalPages={announcementsRes.data.page?.totalPages ?? 0}
      />
    );
  }

  // general 또는 popular 탭 → 게시글 + 공지 3개 병렬 fetch
  const sort = tab === "popular" ? ["viewCount,desc"] as const : ["createdAt,desc"] as const;

  const [postsRes, pinnedRes] = await Promise.all([
    getApiBoardsBoardidPosts(
      COMMUNITY_BOARD_ID,
      { page, size: POSTS_PER_PAGE, sort },
      token ? { headers: withToken(token).headers } : undefined,
    ),
    getApiBoardsBoardidAnnouncements(
      COMMUNITY_BOARD_ID,
      { page: 0, size: PINNED_ANNOUNCEMENT_COUNT },
      token ? { headers: withToken(token).headers } : undefined,
    ),
  ]);

  return (
    <BoardContent
      tab={tab}
      currentPage={Number(params.page) || 1}
      currentUserId={currentUserId}
      initialPosts={postsRes.data.content ?? []}
      initialAnnouncements={pinnedRes.data.content ?? []}
      totalElements={postsRes.data.page?.totalElements ?? 0}
      totalPages={postsRes.data.page?.totalPages ?? 0}
    />
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/community/page.tsx src/app/(main)/community/loading.tsx
git commit -m "feat: add community board RSC page with data fetching"
```

---

### Task 5: BoardContent, BoardTabs — 탭 및 URL 제어

**Files:**
- Create: `src/app/(main)/community/_components/BoardContent.tsx`
- Create: `src/app/(main)/community/_components/BoardTabs.tsx`

**Interfaces:**
- Consumes: search params + API 응답 데이터 (props), `useIsMobile`, `COMMUNITY_BOARD_ID` 등
- Produces: PostList에 데이터 전달, 탭/페이지 URL 업데이트 (`router.push`)

- [ ] **Step 1: Create BoardContent**

```tsx
// src/app/(main)/community/_components/BoardContent.tsx
"use client";

import type { PostSummaryResponse, UserAnnouncementSummaryResponse } from "@/apis/generated/api";
import { getApiBoardsBoardidPosts } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useIsMobile } from "../_hooks/useIsMobile";
import { COMMUNITY_BOARD_ID, LOAD_MORE_MAX_CLICKS, POSTS_PER_PAGE } from "../_lib/constants";
import BoardTabs from "./BoardTabs";
import PostList from "./PostList";

interface BoardContentProps {
  tab: string;
  currentPage: number;
  currentUserId?: number;
  initialPosts: PostSummaryResponse[];
  initialAnnouncements: UserAnnouncementSummaryResponse[];
  totalElements: number;
  totalPages: number;
}

export default function BoardContent({
  tab,
  currentPage,
  currentUserId,
  initialPosts,
  initialAnnouncements,
  totalElements,
  totalPages,
}: BoardContentProps) {
  const router = useRouter();
  const isMobile = useIsMobile();

  // 모바일 "더보기" 상태
  const [loadMorePage, setLoadMorePage] = useState(1);
  const [accumulatedPosts, setAccumulatedPosts] = useState<PostSummaryResponse[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // rerender-split-combined-hooks: useRef로 loadMorePage 참조를 유지해
  // handleLoadMore의 의존성 배열에서 loadMorePage를 제거하고 콜백을 안정화
  const loadMorePageRef = useRef(loadMorePage);
  loadMorePageRef.current = loadMorePage;

  // 더보기 모드인가?
  const isLoadMoreMode = isMobile && loadMorePage <= LOAD_MORE_MAX_CLICKS;

  const displayPosts = isLoadMoreMode && accumulatedPosts.length > 0
    ? [...initialPosts, ...accumulatedPosts]
    : initialPosts;

  const handleTabChange = useCallback(
    (newTab: string) => {
      setLoadMorePage(1);
      setAccumulatedPosts([]);
      router.push(`/community?tab=${newTab}&page=1`);
    },
    [router],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setLoadMorePage(1);
      setAccumulatedPosts([]);
      router.push(`/community?tab=${tab}&page=${page}`);
    },
    [router, tab],
  );

  // bundle-dynamic-imports: 모듈은 컴포넌트 최상단에서 정적으로 import.
  // async-cheap-condition-before-await: 동기 가드(isLoadingMore)를 먼저 체크 후 async 수행.
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return; // cheap sync guard first

    setIsLoadingMore(true);
    try {
      const nextPage = loadMorePageRef.current + 1;
      const token = await getAuthToken();
      const opts = token ? { headers: withToken(token).headers } : undefined;
      const res = await getApiBoardsBoardidPosts(
        COMMUNITY_BOARD_ID,
        { page: nextPage - 1, size: POSTS_PER_PAGE },
        opts,
      );
      setAccumulatedPosts((prev) => [...prev, ...(res.data.content ?? [])]);
      setLoadMorePage(nextPage);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore]); // loadMorePage는 ref로 참조하므로 deps 불필요

  const showPagination = !isLoadMoreMode && totalPages > 1;
  const loadMoreRemaining = LOAD_MORE_MAX_CLICKS - loadMorePage;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="px-4">
          <BoardTabs activeTab={tab} onTabChange={handleTabChange} />
        </div>
      </div>

      <div className="px-4 py-4">
        <PostList
          posts={displayPosts}
          announcements={tab !== "announcement" ? initialAnnouncements : []}
          currentUserId={currentUserId}
          isMobile={isMobile}
          isLoadMoreMode={isLoadMoreMode}
          showPagination={showPagination}
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          loadMoreRemaining={loadMoreRemaining}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create BoardTabs**

```tsx
// src/app/(main)/community/_components/BoardTabs.tsx
"use client";

import { useCallback } from "react";

const TABS = [
  { key: "general", label: "일반" },
  { key: "popular", label: "인기" },
  { key: "announcement", label: "공지" },
] as const;

interface BoardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BoardTabs({ activeTab, onTabChange }: BoardTabsProps) {
  return (
    <div className="flex gap-0">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={`
            px-4 py-3 text-sm font-medium transition-colors relative
            ${
              activeTab === tab.key
                ? "text-amber-600"
                : "text-gray-500 hover:text-gray-700"
            }
          `}
        >
          {tab.label}
          {activeTab === tab.key && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />
          )}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/community/_components/BoardContent.tsx src/app/(main)/community/_components/BoardTabs.tsx
git commit -m "feat: add BoardContent and BoardTabs with tab/page URL control"
```

---

### Task 6: PostList, PostItem, AnnouncementItem — 게시글 목록 UI

**Files:**
- Create: `src/app/(main)/community/_components/PostList.tsx`
- Create: `src/app/(main)/community/_components/PostItem.tsx`
- Create: `src/app/(main)/community/_components/AnnouncementItem.tsx`
- Create: `src/app/(main)/community/_components/PostCardList.tsx` (모바일 카드형)
- Create: `src/app/(main)/community/_components/LoadMorePagination.tsx`

**Interfaces:**
- Consumes: `PostSummaryResponse[]`, `UserAnnouncementSummaryResponse[]`, `currentUserId`, `isMobile` 등
- Produces: 화면에 표시되는 게시글 목록 + 공지 고정 + 페이지네이션

- [ ] **Step 1: Create AnnouncementItem**

```tsx
// src/app/(main)/community/_components/AnnouncementItem.tsx
import type { UserAnnouncementSummaryResponse } from "@/apis/generated/api";

interface AnnouncementItemProps {
  announcement: UserAnnouncementSummaryResponse;
  isMobile: boolean;
}

// rendering-content-visibility: 공지도 목록 아이템이므로 content-visibility 적용
export default function AnnouncementItem({ announcement, isMobile }: AnnouncementItemProps) {
  if (isMobile) {
    return (
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5"
        style={{ contentVisibility: "auto", containIntrinsicSize: "0 44px" }}>
        <span className="shrink-0 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          공지
        </span>
        <span className="text-sm text-gray-800 truncate">{announcement.title}</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_80px_100px] gap-3 items-center bg-amber-50 border-b border-amber-200 px-4 py-3"
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 40px" }}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          공지
        </span>
        <span className="text-sm font-medium text-gray-800 truncate">{announcement.title}</span>
      </div>
      <span className="text-xs text-gray-500 text-right">관리자</span>
      <span className="text-xs text-gray-500 text-right">
        {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString("ko-KR") : ""}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Create PostItem**

```tsx
// src/app/(main)/community/_components/PostItem.tsx
import type { PostSummaryResponse } from "@/apis/generated/api";
import Link from "next/link";
import { memo } from "react";

interface PostItemProps {
  post: PostSummaryResponse;
  isMobile: boolean;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "방금 전";
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffHours < 48) return "어제";
  return date.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

// rerender-memo: PostItem은 목록에서 최대 60개까지 렌더링되므로
// 부모 리렌더 시 불필요한 재생성을 막기 위해 React.memo로 감쌈
const PostItem = memo(function PostItem({ post, isMobile }: PostItemProps) {
  if (isMobile) {
    return (
      <Link
        href={`/community/posts/${post.id}`}
        className="block border-b border-gray-100 px-1 py-3 hover:bg-gray-50 transition-colors"
        // rendering-content-visibility: 오프스크린 아이템의 layout/paint 생략
        style={{ contentVisibility: "auto", containIntrinsicSize: "0 60px" }}
      >
        <div className="text-sm font-medium text-gray-900 line-clamp-1">{post.title}</div>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
          <span>#{post.authorId}</span>
          <span>·</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/community/posts/${post.id}`}
      className="grid grid-cols-[1fr_80px_100px] gap-3 items-center border-b border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors"
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 44px" }}
    >
      <span className="text-sm font-medium text-gray-900 truncate">{post.title}</span>
      <span className="text-xs text-gray-500 text-right">#{post.authorId}</span>
      <span className="text-xs text-gray-500 text-right">{formatDate(post.createdAt)}</span>
    </Link>
  );
});

export default PostItem;
```

- [ ] **Step 3: Create LoadMorePagination**

```tsx
// src/app/(main)/community/_components/LoadMorePagination.tsx
"use client";

interface LoadMorePaginationProps {
  isMobile: boolean;
  isLoadMoreMode: boolean;
  showPagination: boolean;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  loadMoreRemaining: number;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onPageChange: (page: number) => void;
}

export default function LoadMorePagination({
  isMobile,
  isLoadMoreMode,
  showPagination,
  currentPage,
  totalPages,
  loadMoreRemaining,
  isLoadingMore,
  onLoadMore,
  onPageChange,
}: LoadMorePaginationProps) {
  if (isMobile && isLoadMoreMode) {
    // 모바일 "더보기" 버튼 (glassmorphism floating)
    return (
      <div className="sticky bottom-0">
        {/* fade-out gradient */}
        <div className="h-12 bg-gradient-to-b from-transparent to-white/60" />
        <div className="bg-white/55 backdrop-blur-md border-t border-white/70 px-4 pb-4 pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="
              w-full py-2.5 rounded-xl text-sm font-bold
              border border-amber-600/40 bg-amber-600/10
              text-amber-800 backdrop-blur-sm
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all
            "
          >
            {isLoadingMore ? "로딩 중..." : `더보기 (${loadMoreRemaining} / ${loadMoreRemaining + 1})`}
          </button>
        </div>
      </div>
    );
  }

  if (showPagination) {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="flex items-center justify-center gap-1 py-4">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-30 hover:bg-gray-50"
        >
          ‹
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              p === currentPage
                ? "bg-amber-600 text-white"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-30 hover:bg-gray-50"
        >
          ›
        </button>
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 4: Create PostCardList (모바일 카드형)**

```tsx
// src/app/(main)/community/_components/PostCardList.tsx
import type { PostSummaryResponse } from "@/apis/generated/api";
import PostItem from "./PostItem";

interface PostCardListProps {
  posts: PostSummaryResponse[];
}

export default function PostCardList({ posts }: PostCardListProps) {
  return (
    <div className="divide-y divide-gray-100">
      {posts.map((post) => (
        <PostItem key={post.id} post={post} isMobile />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create PostList (통합 목록)**

```tsx
// src/app/(main)/community/_components/PostList.tsx
import type { PostSummaryResponse, UserAnnouncementSummaryResponse } from "@/apis/generated/api";
import AnnouncementItem from "./AnnouncementItem";
import LoadMorePagination from "./LoadMorePagination";
import PostCardList from "./PostCardList";
import PostItem from "./PostItem";

interface PostListProps {
  posts: PostSummaryResponse[];
  announcements: UserAnnouncementSummaryResponse[];
  currentUserId?: number;
  isMobile: boolean;
  isLoadMoreMode: boolean;
  showPagination: boolean;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  loadMoreRemaining: number;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onPageChange: (page: number) => void;
}

export default function PostList({
  posts,
  announcements,
  isMobile,
  isLoadMoreMode,
  showPagination,
  currentPage,
  totalPages,
  loadMoreRemaining,
  isLoadingMore,
  onLoadMore,
  onPageChange,
}: PostListProps) {
  const isEmpty = posts.length === 0 && announcements.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-sm">게시글이 없습니다.</p>
        <p className="text-xs mt-1">첫 번째 게시글을 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 고정 공지 (일반/인기 탭에서만) */}
      {announcements.length > 0 && (
        <div className="divide-y divide-amber-200">
          {announcements.map((a) => (
            <AnnouncementItem key={a.id} announcement={a} isMobile={isMobile} />
          ))}
          {/* 공지와 게시글 사이 구분선 */}
          <div className="border-b border-gray-200" />
        </div>
      )}

      {/* 게시글 목록 */}
      {isMobile ? (
        <PostCardList posts={posts} />
      ) : (
        <div>
          {/* 데스크탑 테이블 헤더 */}
          <div className="grid grid-cols-[1fr_80px_100px] gap-3 items-center bg-gray-50 border-b border-gray-200 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase">
            <span>제목</span>
            <span className="text-right">작성자</span>
            <span className="text-right">날짜</span>
          </div>
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <PostItem key={post.id} post={post} isMobile={false} />
            ))}
          </div>
        </div>
      )}

      {/* 페이지네이션 */}
      <LoadMorePagination
        isMobile={isMobile}
        isLoadMoreMode={isLoadMoreMode}
        showPagination={showPagination}
        currentPage={currentPage}
        totalPages={totalPages}
        totalElements={0}
        loadMoreRemaining={loadMoreRemaining}
        isLoadingMore={isLoadingMore}
        onLoadMore={onLoadMore}
        onPageChange={onPageChange}
      />
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/(main)/community/_components/PostList.tsx src/app/(main)/community/_components/PostItem.tsx src/app/(main)/community/_components/AnnouncementItem.tsx src/app/(main)/community/_components/PostCardList.tsx src/app/(main)/community/_components/LoadMorePagination.tsx
git commit -m "feat: add PostList, PostItem, AnnouncementItem, and pagination components"
```

---

### Task 7: 게시글 상세 페이지 (PostDetail) — react-markdown 렌더 포함

**Files:**
- Create: `src/app/(main)/community/posts/[postId]/page.tsx`
- Create: `src/app/(main)/community/posts/[postId]/loading.tsx`
- Create: `src/app/(main)/community/posts/[postId]/_components/PostDetailContent.tsx`

**Interfaces:**
- Consumes: `getApiBoardsBoardidPostsPostid` (API), `react-markdown`, `rehype-sanitize`, `COMMUNITY_BOARD_ID`, `deletePostAction`
- Produces: 게시글 상세 화면

- [ ] **Step 1: Create page.tsx**

```tsx
// src/app/(main)/community/posts/[postId]/page.tsx
import { getApiBoardsBoardidPostsPostid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions } from "@/lib/auth";
import { getAuthToken } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { COMMUNITY_BOARD_ID } from "../../_lib/constants";
import PostDetailContent from "./_components/PostDetailContent";

interface PostDetailPageProps {
  params: Promise<{ postId: string }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params;
  const id = Number(postId);

  // async-parallel: session + token 병렬 fetch
  const [session, token] = await Promise.all([
    getServerSession(authOptions),
    getAuthToken(),
  ]);

  const currentUserId = session?.user?.id ? Number(session.user.id) : undefined;

  let post;
  try {
    const res = await getApiBoardsBoardidPostsPostid(
      COMMUNITY_BOARD_ID,
      id,
      token ? { headers: withToken(token).headers } : undefined,
    );
    post = res.data;
  } catch {
    notFound();
  }

  return (
    <PostDetailContent
      post={post}
      currentUserId={currentUserId}
    />
  );
}
```

- [ ] **Step 2: Create loading.tsx**

```tsx
// src/app/(main)/community/posts/[postId]/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function PostDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Skeleton className="mb-2 h-6 w-20" />
      <Skeleton className="mb-4 h-8 w-3/4" />
      <Skeleton className="mb-8 h-4 w-1/3" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create PostDetailContent**

```tsx
// src/app/(main)/community/posts/[postId]/_components/PostDetailContent.tsx
"use client";

import type { PostResponse } from "@/apis/generated/api";
import { FormMessage } from "@/components/ui/form-message";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { deletePostAction } from "../../../actions";
import Link from "next/link";
import dynamic from "next/dynamic";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

// bundle-dynamic-imports: react-markdown은 약 100KB+ 번들.
// PostDetailContent에서만 사용되므로 next/dynamic으로 lazy-load (ssr: false).
// (remark-gfm, rehype-sanitize 플러그인은 가벼워서 정적 import)
const ReactMarkdown = dynamic(
  () => import("react-markdown").then((m) => m.default),
  { ssr: false },
);

interface PostDetailContentProps {
  post: PostResponse;
  currentUserId?: number;
}

export default function PostDetailContent({ post, currentUserId }: PostDetailContentProps) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isAuthor = currentUserId !== undefined && post.authorId === currentUserId;

  const handleDelete = () => {
    if (!confirm("게시글을 삭제하시겠습니까?")) return;
    startDelete(async () => {
      const result = await deletePostAction(post.id!);
      if (result.error) {
        setDeleteError(result.error);
      }
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* 뒤로가기 */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        ← 목록으로
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* 헤더 */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900 leading-snug mb-2">
            {post.title}
          </h1>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>#{post.authorId}</span>
            <span>·</span>
            <span>
              {post.createdAt
                ? new Date(post.createdAt).toLocaleString("ko-KR")
                : ""}
            </span>
          </div>
        </div>

        {/* 본문 (react-markdown) — lazy-loaded */}
        <div className="px-5 py-5 prose prose-sm max-w-none prose-img:rounded-lg prose-img:my-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {post.content ?? ""}
          </ReactMarkdown>
        </div>

        {/* 액션 */}
        {isAuthor && (
          <div className="px-5 pb-5 flex items-center gap-3 border-t border-gray-100 pt-4">
            <Link
              href={`/community/posts/${post.id}/edit`}
              className="text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              수정
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-sm text-red-600 border border-red-300 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </button>
            <FormMessage message={deleteError} variant="error" />
          </div>
        )}
      </div>
    </div>
  );
}
```

> **참고:** `PostDetailContent` 상단에 `import { useState } from "react"`가 필요합니다. 위 코드에 누락되었으니 추가하세요.

- [ ] **Step 4: Commit**

```bash
git add src/app/(main)/community/posts/[postId]/
git commit -m "feat: add post detail page with react-markdown rendering"
```

---

### Task 8: 게시글 작성/수정 폼 (PostForm) — 이미지 업로드 포함

**Files:**
- Create: `src/app/(main)/community/posts/new/page.tsx`
- Create: `src/app/(main)/community/posts/new/_components/PostCreateContent.tsx`
- Create: `src/app/(main)/community/posts/new/_components/PostForm.tsx`
- Create: `src/app/(main)/community/posts/[postId]/edit/page.tsx`
- Create: `src/app/(main)/community/posts/[postId]/edit/_components/PostEditContent.tsx`

**Interfaces:**
- Consumes: `createPostAction`, `updatePostAction`, `COMMUNITY_BOARD_ID`, `getApiS3Presigned`, `useActionState`, `useFormStatus`
- Produces: 게시글 작성/수정 폼 + 이미지 업로드기

- [ ] **Step 1: Create PostForm (공용 폼 컴포넌트)**

```tsx
// src/app/(main)/community/posts/new/_components/PostForm.tsx
"use client";

import { FormMessage } from "@/components/ui/form-message";
import { getApiS3Presigned } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { useRef, useState, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { MAX_IMAGE_COUNT, MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_TYPES } from "../../_lib/constants";

interface PostFormProps {
  action: (formData: FormData) => void;
  state: { success: boolean; error?: string; values?: Record<string, string> } | null;
  defaultValues?: { title?: string; content?: string };
  submitLabel?: string;
}

interface UploadedImage {
  id: string;
  fileId: string; // temp id
  url: string; // object URL for preview
  markdown: string; // the ![]() text to insert
  uploading: boolean;
  error: boolean;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors hover:bg-amber-700"
    >
      {pending ? "처리 중..." : label}
    </button>
  );
}

export default function PostForm({ action, state, defaultValues, submitLabel = "등록하기" }: PostFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<UploadedImage[]>([]);

  const insertAtCursor = useCallback((text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = ta.value.substring(0, start);
    const after = ta.value.substring(end);
    ta.value = before + text + after;
    ta.selectionStart = ta.selectionEnd = start + text.length;
    ta.focus();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    // reset input so same file can be re-selected
    e.target.value = "";

    const remaining = MAX_IMAGE_COUNT - images.length;
    const toUpload = files.slice(0, remaining);

    for (const file of toUpload) {
      // client-side validation
      if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
        alert(`${file.name}: 지원하지 않는 파일 형식입니다. (JPG/PNG/WEBP만 가능)`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        alert(`${file.name}: 파일 크기가 ${MAX_IMAGE_SIZE_MB}MB를 초과합니다.`);
        continue;
      }

      const tempId = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      const entry: UploadedImage = {
        id: tempId,
        fileId: tempId,
        url: previewUrl,
        markdown: "",
        uploading: true,
        error: false,
      };
      setImages((prev) => [...prev, entry]);

      try {
        const token = await getAuthToken();
        if (!token) throw new Error("인증 필요");

        const key = `community/${crypto.randomUUID()}/${file.name}`;
        const presignedRes = await getApiS3Presigned({ key, filename: file.name }, withToken(token));
        const presignedUrl = presignedRes.data.url!;

        await fetch(presignedUrl, { method: "PUT", body: file });

        const cdnUrl = presignedUrl.split("?")[0]; // strip query params for CDN URL
        const markdown = `![${file.name}](${cdnUrl})`;

        setImages((prev) =>
          prev.map((img) =>
            img.id === tempId
              ? { ...img, markdown, uploading: false }
              : img,
          ),
        );
      } catch {
        setImages((prev) =>
          prev.map((img) =>
            img.id === tempId ? { ...img, uploading: false, error: true } : img,
          ),
        );
      }
    }
  }, [images.length]);

  const handleInsertImage = useCallback(
    (img: UploadedImage) => {
      if (!img.markdown || img.uploading) return;
      insertAtCursor(`\n${img.markdown}\n`);
    },
    [insertAtCursor],
  );

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  return (
    <form ref={formRef} action={action} className="mx-auto max-w-3xl px-4 py-6">
      {/* 뒤로가기 */}
      <a href="/community" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        ← 목록으로
      </a>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h1 className="text-lg font-bold text-gray-900 mb-5">{submitLabel === "수정하기" ? "글 수정" : "글쓰기"}</h1>

        {/* 제목 */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">제목</label>
          <input
            type="text"
            name="title"
            defaultValue={defaultValues?.title ?? state?.values?.title ?? ""}
            maxLength={200}
            placeholder="글 제목을 입력하세요"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
          />
        </div>

        {/* 내용 */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">내용</label>
          <textarea
            ref={textareaRef}
            name="content"
            defaultValue={defaultValues?.content ?? state?.values?.content ?? ""}
            rows={10}
            placeholder="내용을 입력하세요. 이미지는 첨부 후 클릭하면 커서 위치에 삽입됩니다."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 resize-y min-h-[160px]"
          />
        </div>

        {/* 이미지 첨부 */}
        <div className="mb-4 border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50/50">
          <div className="text-[11px] font-bold text-gray-500 uppercase mb-2">첨부 이미지</div>

          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {images.map((img) => (
                <div key={img.id} className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-200 group">
                  <img
                    src={img.url}
                    alt="preview"
                    className={`w-full h-full object-cover cursor-pointer ${img.uploading ? "opacity-50" : ""}`}
                    onClick={() => handleInsertImage(img)}
                  />
                  {img.uploading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {img.error && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                      <span className="text-[10px] text-red-600 font-bold">실패</span>
                    </div>
                  )}
                  {!img.uploading && !img.error && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(img.id); }}
                      className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= MAX_IMAGE_COUNT}
            className="text-xs text-gray-500 border border-dashed border-gray-400 rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            + 이미지 추가 ({images.length}/{MAX_IMAGE_COUNT})
          </button>
          <p className="text-[10px] text-gray-400 mt-1">이미지 클릭 시 커서 위치에 삽입 · 최대 5장 · JPG/PNG/WEBP · 5MB 이하</p>
        </div>

        {/* 에러 메시지 */}
        <div className="mb-4">
          <FormMessage message={state?.error} variant="error" />
        </div>

        {/* 제출 */}
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create PostCreateContent**

```tsx
// src/app/(main)/community/posts/new/_components/PostCreateContent.tsx
"use client";

import { useActionState } from "react";
import { createPostAction } from "../../../actions";
import PostForm from "./PostForm";

export default function PostCreateContent() {
  const [state, formAction] = useActionState(createPostAction, null);

  return <PostForm action={formAction} state={state} submitLabel="등록하기" />;
}
```

- [ ] **Step 3: Create posts/new/page.tsx**

```tsx
// src/app/(main)/community/posts/new/page.tsx
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PostCreateContent from "./_components/PostCreateContent";

export default async function PostNewPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/sign-in?callbackUrl=/community/posts/new");
  }
  return <PostCreateContent />;
}
```

- [ ] **Step 4: Create PostEditContent**

```tsx
// src/app/(main)/community/posts/[postId]/edit/_components/PostEditContent.tsx
"use client";

import { useActionState } from "react";
import PostForm from "../../../new/_components/PostForm";
import { updatePostAction } from "../../../../actions";
import type { PostResponse } from "@/apis/generated/api";

interface PostEditContentProps {
  post: PostResponse;
}

export default function PostEditContent({ post }: PostEditContentProps) {
  const boundAction = useActionState(
    updatePostAction.bind(null, post.id!),
    null,
  );

  // useActionState returns [state, formAction]
  const [state, formAction] = boundAction;

  return (
    <PostForm
      action={formAction}
      state={state}
      defaultValues={{ title: post.title, content: post.content }}
      submitLabel="수정하기"
    />
  );
}
```

> **참고:** `useActionState` with `bind` for extra args: Next.js Server Action with `bind` returns a function that matches the `(prev, formData)` signature. The `[state, formAction] = useActionState(action, null)` pattern is the standard form. Make sure the `useActionState` import is `import { useActionState } from "react"`.

```tsx
// src/app/(main)/community/posts/[postId]/edit/page.tsx
import { getApiBoardsBoardidPostsPostid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions } from "@/lib/auth";
import { getAuthToken } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { COMMUNITY_BOARD_ID } from "../../../_lib/constants";
import PostEditContent from "./_components/PostEditContent";

interface PostEditPageProps {
  params: Promise<{ postId: string }>;
}

export default async function PostEditPage({ params }: PostEditPageProps) {
  const { postId } = await params;
  const id = Number(postId);

  // async-parallel: session 먼저 체크 (early redirect)
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/sign-in?callbackUrl=/community/posts/${id}/edit`);
  }

  // async-parallel: token + API fetch 병렬
  // (getApiBoardsBoardidPostsPostid은 public read-only API이므로 token 불필요)
  const [token, apiRes] = await Promise.all([
    getAuthToken(),
    getApiBoardsBoardidPostsPostid(COMMUNITY_BOARD_ID, id).catch(() => null),
  ]);

  if (!apiRes) {
    notFound();
  }
  const post = apiRes.data;

  // 본인 글만 수정 가능
  if (post.authorId !== Number(session.user.id)) {
    redirect(`/community/posts/${id}`);
  }

  return <PostEditContent post={post} />;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(main)/community/posts/
git commit -m "feat: add post create/edit forms with image upload"
```

---

### Task 9: 헤더 네비게이션에 커뮤니티 링크 추가

**Files:**
- Modify: `src/app/(main)/_components/layout/Header/constants.ts`

- [ ] **Step 1: Add community link to nav**

```ts
// src/app/(main)/_components/layout/Header/constants.ts
export const NAV_LINKS = [
  { href: "/about", label: "회사소개" },
  { href: "/brand", label: "브랜드" },
  { href: "/archive", label: "아카이브" },
  { href: "/general-items", label: "일반상품" },
  { href: "/community", label: "커뮤니티" },      // ← 추가
] as const;
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(main)/_components/layout/Header/constants.ts
git commit -m "feat: add community nav link"
```

---

### 스펙 대비 체크리스트

- [x] 게시글 목록 (공지 3개 고정 + 게시글) — Task 4, 6
- [x] 공지·일반·인기 탭 — Task 5 (BoardTabs)
- [x] 모바일: 더보기(×5) → 페이지네이션 전환 — Task 5, 6 (LoadMorePagination)
- [x] 데스크탑: URL 기반 페이지네이션 — Task 6 (LoadMorePagination)
- [x] 게시글 상세 (react-markdown 렌더) — Task 7
- [x] 게시글 작성/수정 (useActionState) — Task 8
- [x] 이미지 첨부 (S3 Presigned → markdown 삽입) — Task 8 (PostForm)
- [x] Server Actions (create/update/delete) — Task 3
- [x] 인증/권한 처리 — 각 page.tsx에서 session 체크
- [x] 헤더 네비게이션 — Task 9
- [ ] 댓글 — 제외 (API 미존재)
- [ ] 어드민 게시판 관리 — 제외 (별도 스펙)