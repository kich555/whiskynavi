"use client";

import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  searchParams: Record<string, string | undefined>;
  basePath: string;
  alwaysVisible?: boolean;
}

export default function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  searchParams,
  basePath,
  alwaysVisible = false,
}: PaginationProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const createQueryString = (updates: Record<string, string>) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    Object.entries(updates).forEach(([k, v]) => {
      params.set(k, v);
    });
    return params.toString();
  };

  const handlePageChange = (page: number) => {
    startTransition(() => {
      router.push(`${basePath}?${createQueryString({ page: String(page) })}`);
    });
  };

  const handleItemsPerPageChange = (value: number) => {
    startTransition(() => {
      router.push(`${basePath}?${createQueryString({ limit: String(value), page: "1" })}`);
    });
  };

  if (!alwaysVisible && totalPages <= 1) return null;

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm text-gray-600">페이지당:</Label>
        <select
          value={itemsPerPage}
          onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
          className="rounded border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="ml-4 text-sm text-gray-600">
          {totalItems}개 중 {startIndex}-{endIndex}
        </span>
        {isPending && <div className="ml-2 h-4 w-4 animate-spin rounded-full border-b-2 border-amber-600"></div>}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || isPending}
          className="cursor-pointer rounded border border-gray-300 p-1.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft size={18} />
        </button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }

          return (
            <button
              type="button"
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              disabled={isPending}
              className={`h-8 w-8 cursor-pointer rounded text-sm font-medium ${
                currentPage === pageNum ? "bg-amber-600 text-white" : "border border-gray-300 hover:bg-gray-50"
              } disabled:opacity-50`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isPending}
          className="cursor-pointer rounded border border-gray-300 p-1.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
