"use client";

import type { PostSummaryResponse, UserAnnouncementSummaryResponse } from "@/apis/generated/api";
import { useState } from "react";
import AnnouncementItem from "./AnnouncementItem";
import LoadMorePagination from "./LoadMorePagination";
import PostCardList from "./PostCardList";
import PostItem from "./PostItem";

interface PostListProps {
  posts: PostSummaryResponse[];
  announcements: UserAnnouncementSummaryResponse[];
  allAnnouncements: UserAnnouncementSummaryResponse[];
  boardId: string;
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
  allAnnouncements,
  boardId,
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
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const displayAnnouncements = showAllAnnouncements ? allAnnouncements : announcements;
  const isEmpty = posts.length === 0 && announcements.length === 0;

  if (isEmpty) {
    return (
      <div className="flex min-h-[calc(100vh-430px)] flex-col items-center justify-center text-gray-400">
        <p className="text-sm">게시글이 없습니다.</p>
        <p className="mt-1 text-xs">첫 번째 게시글을 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      {/* 고정 공지 (일반/인기 탭에서만) */}
      {announcements.length > 0 && (
        <div className="divide-y divide-white/10">
          {displayAnnouncements.map((a) => (
            <AnnouncementItem key={a.id} announcement={a} isMobile={isMobile} boardId={boardId} />
          ))}
          {/* 펼치기/접기 버튼: 전체 공지가 3개보다 많을 때만 표시 */}
          {allAnnouncements.length > announcements.length && (
            <button
              type="button"
              onClick={() => setShowAllAnnouncements((prev) => !prev)}
              className="flex w-full items-center justify-center gap-1 border-b border-white/10 px-4 py-2 text-xs text-gray-400 transition-colors hover:text-amber-500"
            >
              {showAllAnnouncements ? "△ 접기" : `▽ 공지 전체보기 (${allAnnouncements.length}개)`}
            </button>
          )}
          {/* 공지와 게시글 사이 구분선 (접혀있을 때만) */}
          {!showAllAnnouncements && <div className="border-b border-white/10" />}
        </div>
      )}

      {/* 게시글 목록 — 공지 펼치기와 무관하게 항상 표시 */}
      {posts.length > 0 && (
        <>
          {isMobile ? (
            <PostCardList posts={posts} boardId={boardId} />
          ) : (
            <div>
              {/* 데스크탑 테이블 헤더 */}
              <div className="grid grid-cols-[1fr_80px_100px] items-center gap-3 border-b border-white/10 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase">
                <span>제목</span>
                <span className="text-right">작성자</span>
                <span className="text-right">날짜</span>
              </div>
              <div className="divide-y divide-white/10">
                {posts.map((post) => (
                  <PostItem key={post.id} post={post} isMobile={false} boardId={boardId} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 페이지네이션 — 게시글이 없어도 공지 탭에서 페이지네이션 필요 */}
      {(posts.length > 0 || announcements.length > 0) && (
        <LoadMorePagination
          isMobile={isMobile}
          isLoadMoreMode={isLoadMoreMode}
          showPagination={showPagination}
          currentPage={currentPage}
          totalPages={totalPages}
          loadMoreRemaining={loadMoreRemaining}
          isLoadingMore={isLoadingMore}
          onLoadMore={onLoadMore}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
