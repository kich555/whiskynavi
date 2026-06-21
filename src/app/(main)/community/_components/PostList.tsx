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
      <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center text-gray-400">
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
        loadMoreRemaining={loadMoreRemaining}
        isLoadingMore={isLoadingMore}
        onLoadMore={onLoadMore}
        onPageChange={onPageChange}
      />
    </div>
  );
}