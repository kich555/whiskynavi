"use client";

interface LoadMorePaginationProps {
  isMobile: boolean;
  isLoadMoreMode: boolean;
  showPagination: boolean;
  currentPage: number;
  totalPages: number;
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
        <div className="h-12 bg-gradient-to-b from-transparent to-[#1d2429]/40" />
        <div className="bg-[#1d2429]/80 backdrop-blur-md border-t border-white/10 px-4 pb-4 pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="w-full py-2.5 rounded-xl text-sm font-bold border border-amber-600/40 bg-amber-600/10 text-white backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoadingMore
              ? "로딩 중..."
              : `더보기 (${loadMoreRemaining} / ${loadMoreRemaining + 1})`}
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
          className="px-2.5 py-1.5 text-sm border border-white/20 rounded-md disabled:opacity-30 hover:bg-white/5"
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
                : "border border-white/20 text-gray-400 hover:bg-white/5"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-2.5 py-1.5 text-sm border border-white/20 rounded-md disabled:opacity-30 hover:bg-white/5"
        >
          ›
        </button>
      </div>
    );
  }

  return null;
}