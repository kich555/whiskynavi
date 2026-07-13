"use client";

import type {
  GetApiBoardsBoardidPostsSearchType,
  PostSummaryResponse,
  UserAnnouncementSummaryResponse,
} from "@/apis/generated/api";
import { getApiBoardsBoardidPosts } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { Plus, Search, X } from "lucide-react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useIsMobile } from "../_hooks/useIsMobile";
import { LOAD_MORE_MAX_CLICKS, POSTS_PER_PAGE } from "../_lib/constants";
import type { ActivePostCreationRestriction } from "../_lib/post-creation-restriction";
import type { BoardTab } from "../_lib/tabs";
import BoardTabs from "./BoardTabs";
import PostCreationRestrictionNotice from "./PostCreationRestrictionNotice";
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
  postCreationRestriction?: ActivePostCreationRestriction | null;
  initialPosts: PostSummaryResponse[];
  initialAnnouncements: UserAnnouncementSummaryResponse[];
  allAnnouncements: UserAnnouncementSummaryResponse[];
  totalElements: number;
  totalPages: number;
  searchType?: GetApiBoardsBoardidPostsSearchType;
  keyword?: string;
}

export default function BoardContent({
  boardId,
  tab,
  tabs,
  resource,
  postTypeCode,
  currentPage,
  canWritePost,
  postCreationRestriction,
  initialPosts,
  initialAnnouncements,
  allAnnouncements,
  totalElements,
  totalPages,
  searchType,
  keyword,
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

  const buildListHref = useCallback(
    (nextTab: string, page: number, includeSearch = true) => {
      const params = new URLSearchParams({ tab: nextTab, page: String(page) });
      if (includeSearch && searchType && keyword) {
        params.set("searchType", searchType);
        params.set("keyword", keyword);
      }
      return `/board/${boardId}?${params.toString()}`;
    },
    [boardId, keyword, searchType],
  );

  const handleTabChange = useCallback(
    (newTab: string) => {
      setLoadMorePage(1);
      setAccumulatedPosts([]);
      router.push(buildListHref(newTab, 1));
    },
    [buildListHref, router],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setLoadMorePage(1);
      setAccumulatedPosts([]);
      router.push(buildListHref(tab, page));
    },
    [buildListHref, router, tab],
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
        {
          page: nextPage - 1,
          size: POSTS_PER_PAGE,
          sort: ["createdAt,desc"],
          postTypeCode,
          searchType,
          keyword,
        },
        opts,
      );
      // 응답이 온 사이 다른 탭으로 전환됐다면 이 결과는 버린다 (탭 간 데이터 오염 방지)
      if (tabRef.current !== requestedTab) return;
      setAccumulatedPosts((prev) => [...prev, ...(res.data.content ?? [])]);
      setLoadMorePage(nextPage);
    } finally {
      setIsLoadingMore(false);
    }
  }, [boardId, isLoadingMore, keyword, postTypeCode, searchType, tab]);

  const showPagination = !isLoadMoreMode && totalPages > 1;
  const loadMoreRemaining = LOAD_MORE_MAX_CLICKS - Math.min(loadMorePage, LOAD_MORE_MAX_CLICKS);

  return (
    <div className="mx-auto mt-20 min-h-screen max-w-[1440px] bg-[#1d2429]">
      {/* 탭 헤더 — 페이지 상단에 위치, sticky로 고정 */}
      <div className="sticky top-[64px] z-10 border-b border-white/10 bg-[#1d2429]/95 backdrop-blur-lg lg:top-20">
        <div className="mx-auto flex max-w-4xl min-w-0 items-center gap-2 px-4">
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
        {postCreationRestriction ? (
          <div className="mb-4">
            <PostCreationRestrictionNotice restriction={postCreationRestriction} />
          </div>
        ) : null}
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
          isSearching={Boolean(keyword)}
        />

        {resource === "posts" ? (
          <form
            key={`${searchType ?? "TITLE"}:${keyword ?? ""}`}
            action={`/board/${boardId}`}
            method="get"
            className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end"
          >
            <input type="hidden" name="tab" value={tab} />
            <input type="hidden" name="page" value="1" />
            <select
              name="searchType"
              aria-label="검색 조건"
              defaultValue={searchType ?? "TITLE"}
              className="h-10 rounded-lg border border-white/15 bg-[#252d33] px-3 text-sm text-gray-100 outline-none focus:border-amber-500"
            >
              <option value="TITLE">제목</option>
              <option value="AUTHOR">작성자</option>
            </select>
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
              />
              <input
                name="keyword"
                defaultValue={keyword ?? ""}
                aria-label="검색어"
                placeholder="검색어를 입력하세요"
                className="h-10 w-full rounded-lg border border-white/15 bg-[#252d33] pr-10 pl-9 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-amber-500"
              />
              {keyword ? (
                <button
                  type="button"
                  aria-label="검색어 지우기"
                  onClick={() => router.push(buildListHref(tab, 1, false))}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-gray-500 transition-colors hover:bg-white/10 hover:text-gray-200"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
            <button
              type="submit"
              className="h-10 rounded-lg bg-amber-600 px-5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            >
              검색
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
