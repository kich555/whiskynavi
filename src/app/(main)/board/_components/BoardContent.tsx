"use client";

import type { PostSummaryResponse, UserAnnouncementSummaryResponse } from "@/apis/generated/api";
import { getApiBoardsBoardidPosts } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getSession } from "next-auth/react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useIsMobile } from "../_hooks/useIsMobile";
import { LOAD_MORE_MAX_CLICKS, POSTS_PER_PAGE } from "../_lib/constants";
import type { BoardTab } from "../_lib/tabs";
import BoardTabs from "./BoardTabs";
import PostList from "./PostList";

interface BoardContentProps {
  boardId: string;
  tab: string;
  tabs: BoardTab[];
  resource: "posts" | "announcements";
  postTypeCode?: string;
  currentPage: number;
  /** 게시글 작성 권한 여부. 페이지에서 session/board 권한으로 결정해 전달.
   *  community는 로그인 사용자, news는 admin/super_admin만 true. */
  canWritePost: boolean;
  initialPosts: PostSummaryResponse[];
  initialAnnouncements: UserAnnouncementSummaryResponse[];
  allAnnouncements: UserAnnouncementSummaryResponse[];
  totalElements: number;
  totalPages: number;
}

export default function BoardContent({
  boardId,
  tab,
  tabs,
  resource,
  postTypeCode,
  currentPage,
  canWritePost,
  initialPosts,
  initialAnnouncements,
  allAnnouncements,
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
  // handleLoadMore의 의존성 배열에서 loadMorePage를 제거
  const loadMorePageRef = useRef(loadMorePage);
  loadMorePageRef.current = loadMorePage;

  // 탭 전환 중 진행 중이던 더보기 요청이 응답하면 현재 탭과 다를 수 있으므로,
  // 응답 시점에 tab이 요청 시점과 같은지 확인해 다른 탭으로 새어 들어가지 않게 한다.
  const tabRef = useRef(tab);
  tabRef.current = tab;

  // 더보기 모드인가? (게시글 탭이고 2페이지 이상 있을 때만. 공지 postType 탭은 게시글 API를 쓰지 않으므로 제외)
  const isLoadMoreMode = resource === "posts" && isMobile && totalPages > 1 && loadMorePage <= LOAD_MORE_MAX_CLICKS;

  const displayPosts =
    isLoadMoreMode && accumulatedPosts.length > 0 ? [...initialPosts, ...accumulatedPosts] : initialPosts;

  const handleTabChange = useCallback(
    (newTab: string) => {
      setLoadMorePage(1);
      setAccumulatedPosts([]);
      router.push(`/board/${boardId}?tab=${newTab}&page=1`);
    },
    [router, boardId],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setLoadMorePage(1);
      setAccumulatedPosts([]);
      router.push(`/board/${boardId}?tab=${tab}&page=${page}`);
    },
    [router, boardId, tab],
  );

  // bundle-dynamic-imports: 모듈은 컴포넌트 최상단에서 정적으로 import.
  // async-cheap-condition-before-await: 동기 가드(isLoadingMore)를 먼저 체크 후 async 수행.
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return;

    const requestedTab = tab;
    setIsLoadingMore(true);
    try {
      const nextPage = loadMorePageRef.current + 1;
      const session = await getSession();
      const token = session?.accessToken;
      const opts = withToken(token ?? undefined);
      const res = await getApiBoardsBoardidPosts(
        boardId,
        { page: nextPage - 1, size: POSTS_PER_PAGE, sort: ["createdAt,desc"], postTypeCode },
        opts,
      );
      // 응답이 온 사이 다른 탭으로 전환됐다면 이 결과는 버린다 (탭 간 데이터 오염 방지)
      if (tabRef.current !== requestedTab) return;
      setAccumulatedPosts((prev) => [...prev, ...(res.data.content ?? [])]);
      setLoadMorePage(nextPage);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, postTypeCode, tab, boardId]);

  const showPagination = !isLoadMoreMode && totalPages > 1;
  const loadMoreRemaining = LOAD_MORE_MAX_CLICKS - Math.min(loadMorePage, LOAD_MORE_MAX_CLICKS);

  return (
    <div className="mx-auto mt-20 min-h-screen max-w-[1440px] bg-[#1d2429]">
      {/* 탭 헤더 — 페이지 상단에 위치, sticky로 고정 */}
      <div className="sticky top-[64px] z-10 border-b border-white/10 bg-[#1d2429]/95 backdrop-blur-lg lg:top-20">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4">
          <BoardTabs tabs={tabs} activeTab={tab} onTabChange={handleTabChange} />
          {/* 글쓰기 버튼 — 게시글 탭(POST)에서만, canWritePost 권한이 있을 때만 상시 노출.
            공지 탭(ANNOUNCEMENT)은 admin이 admin 페이지에서 공지를 등록하므로 사용자 화면에서는 숨긴다. */}
          {resource === "posts" && canWritePost ? (
            <button
              type="button"
              onClick={() => router.push(`/board/${boardId}/posts/new`)}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
            >
              <Plus size={14} />
              글쓰기
            </button>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <PostList
          posts={displayPosts}
          announcements={initialAnnouncements}
          allAnnouncements={allAnnouncements}
          boardId={boardId}
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
