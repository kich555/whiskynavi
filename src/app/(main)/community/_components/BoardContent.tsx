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
  // handleLoadMore의 의존성 배열에서 loadMorePage를 제거
  const loadMorePageRef = useRef(loadMorePage);
  loadMorePageRef.current = loadMorePage;

  // 더보기 모드인가?
  const isLoadMoreMode = isMobile && loadMorePage <= LOAD_MORE_MAX_CLICKS;

  const displayPosts =
    isLoadMoreMode && accumulatedPosts.length > 0 ? [...initialPosts, ...accumulatedPosts] : initialPosts;

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
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = loadMorePageRef.current + 1;
      const token = await getAuthToken();
      const opts = withToken(token ?? undefined);
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
  }, [isLoadingMore]);

  const showPagination = !isLoadMoreMode && totalPages > 1;
  const loadMoreRemaining = LOAD_MORE_MAX_CLICKS - Math.min(loadMorePage, LOAD_MORE_MAX_CLICKS);

  return (
    <div className="mx-auto max-w-[1440px]">
      {/* 탭 헤더 — 페이지 상단에 위치, sticky로 고정 */}
      <div className="sticky top-[64px] z-10 border-b border-gray-200 bg-white lg:top-20">
        <div className="mx-auto max-w-4xl px-4">
          <BoardTabs activeTab={tab} onTabChange={handleTabChange} />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
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
