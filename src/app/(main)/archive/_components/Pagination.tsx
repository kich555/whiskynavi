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
    <div className="mt-8 flex items-center justify-center gap-2 pb-4 md:gap-4">
      {currentPage === 1 ? (
        <span className="typo-bold-14 px-2 py-1 whitespace-nowrap text-white opacity-30 md:px-3 md:text-base">
          <ChevronLeft className="md:hidden" size={16} />
          <span className="hidden md:inline">이전</span>
        </span>
      ) : (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="typo-bold-14 px-2 py-1 whitespace-nowrap text-white hover:text-gray-300 md:px-3 md:text-base"
        >
          <ChevronLeft className="md:hidden" size={16} />
          <span className="hidden md:inline">이전</span>
        </Link>
      )}
      <div className="flex items-center gap-1.5 md:gap-3">
        {pageNumbers.map((page, idx) =>
          typeof page === "number" ? (
            <Link
              key={page}
              href={buildPageUrl(page)}
              className={`px-1.5 py-0.5 typo-medium-12 md:px-2 md:py-1 md:text-base ${
                currentPage === page ? "font-bold text-white" : "text-gray-400 hover:text-gray-300"
              }`}
            >
              {page}
            </Link>
          ) : (
            <span
              key={`ellipsis-${idx}`}
              className="typo-medium-12 px-1.5 py-0.5 text-gray-400 md:px-2 md:py-1 md:text-base"
            >
              {page}
            </span>
          ),
        )}
      </div>
      {currentPage === totalPages ? (
        <span className="typo-bold-14 px-2 py-1 whitespace-nowrap text-white opacity-30 md:px-3 md:text-base">
          <ChevronRight className="md:hidden" size={16} />
          <span className="hidden md:inline">다음</span>
        </span>
      ) : (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="typo-bold-14 px-2 py-1 whitespace-nowrap text-white hover:text-gray-300 md:px-3 md:text-base"
        >
          <ChevronRight className="md:hidden" size={16} />
          <span className="hidden md:inline">다음</span>
        </Link>
      )}
    </div>
  );
}
