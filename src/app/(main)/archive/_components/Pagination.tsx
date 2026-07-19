import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildPageUrl: (page: number) => string;
}

function generatePageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (currentPage > 3) pages.push("...");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) pages.push("...");

  pages.push(totalPages);
  return pages;
}

export default function Pagination({ currentPage, totalPages, buildPageUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageNumbers = generatePageNumbers(currentPage, totalPages);

  return (
    <div className="mt-8 flex items-center justify-center gap-2 pb-4 sm:gap-4">
      {currentPage === 1 ? (
        <span className="typo-bold-14 px-2 py-1 text-white opacity-30 sm:px-3 sm:text-base">
          <ChevronLeft className="sm:hidden" size={16} />
          <span className="hidden sm:inline">이전</span>
        </span>
      ) : (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="typo-bold-14 px-2 py-1 text-white hover:text-gray-300 sm:px-3 sm:text-base"
        >
          <ChevronLeft className="sm:hidden" size={16} />
          <span className="hidden sm:inline">이전</span>
        </Link>
      )}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {pageNumbers.map((page, idx) =>
          typeof page === "number" ? (
            <Link
              key={page}
              href={buildPageUrl(page)}
              className={`px-1.5 py-0.5 typo-medium-12 sm:px-2 sm:py-1 sm:text-base ${
                currentPage === page ? "font-bold text-white" : "text-gray-400 hover:text-gray-300"
              }`}
            >
              {page}
            </Link>
          ) : (
            <span
              key={`ellipsis-${idx}`}
              className="typo-medium-12 px-1.5 py-0.5 text-gray-400 sm:px-2 sm:py-1 sm:text-base"
            >
              {page}
            </span>
          ),
        )}
      </div>
      {currentPage === totalPages ? (
        <span className="typo-bold-14 px-2 py-1 text-white opacity-30 sm:px-3 sm:text-base">
          <ChevronRight className="sm:hidden" size={16} />
          <span className="hidden sm:inline">다음</span>
        </span>
      ) : (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="typo-bold-14 px-2 py-1 text-white hover:text-gray-300 sm:px-3 sm:text-base"
        >
          <ChevronRight className="sm:hidden" size={16} />
          <span className="hidden sm:inline">다음</span>
        </Link>
      )}
    </div>
  );
}
