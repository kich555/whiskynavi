"use client";

import type { ItemAdminResponse } from "@/apis/generated/api";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Eye, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import Pagination from "../../_components/Pagination";

interface GeneralItemsContentProps {
  searchParams: {
    page?: string;
    limit?: string;
    q?: string;
  };
  items: ItemAdminResponse[];
  totalElements: number;
}

export default function GeneralItemsContent({ searchParams, items, totalElements }: GeneralItemsContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;
  const searchQuery = searchParams.q || "";

  const handleSearch = (value: string) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, current]) => {
      if (current) params.set(key, current);
    });
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    router.push(`/admin/general-items?${params.toString()}`);
  };

  return (
    <>
      <AdminHeader title="일반상품관리" onToggleSidebar={toggle} searchQuery={searchQuery} onSearch={handleSearch} />

      <div className="p-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="typo-medium-14 text-gray-600">총 {totalElements.toLocaleString("ko-KR")}건</p>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/general-items/new"
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 typo-medium-14 text-white transition-colors hover:bg-amber-700"
            >
              <Plus size={16} />
              일반상품 등록
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">ID</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">상품명</th>
                  <th className="typo-bold-12 px-4 py-3 text-right text-gray-700 uppercase">재고</th>
                  <th className="typo-bold-12 px-4 py-3 text-right text-gray-700 uppercase">소비자가</th>
                  <th className="typo-bold-12 px-4 py-3 text-right text-gray-700 uppercase">공급가</th>
                  <th className="typo-bold-12 px-4 py-3 text-center text-gray-700 uppercase">노출</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">수정일</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                      등록된 일반상품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id ?? item.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 typo-medium-14 text-gray-900">{item.id ?? "-"}</td>
                      <td className="px-4 py-3">
                        <div className="max-w-[260px]">
                          <p className="typo-medium-14 truncate text-gray-900">{item.name ?? "-"}</p>
                          {item.description ? (
                            <p className="truncate typo-medium-12 text-gray-500">{item.description}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right typo-medium-14 text-gray-900">
                        {(item.stockQuantity ?? 0).toLocaleString("ko-KR")}
                      </td>
                      <td className="px-4 py-3 text-right typo-medium-14 text-gray-900">
                        {formatCurrency(item.consumerPrice)}
                      </td>
                      <td className="px-4 py-3 text-right typo-medium-14 text-gray-600">{formatCurrency(item.supplyPrice)}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`rounded-full px-2 py-1 typo-medium-12 font-medium ${
                            item.visible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.visible ? "노출" : "숨김"}
                        </span>
                      </td>
                      <td className="px-4 py-3 typo-medium-14 whitespace-nowrap text-gray-600">
                        {formatDate(item.updatedAt ?? item.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={item.id != null ? `/admin/general-items/${item.id}` : "/admin/general-items"}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 typo-medium-14 text-amber-700 transition-colors hover:bg-amber-50"
                        >
                          <Eye size={15} />
                          상세조회
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={totalElements}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            searchParams={searchParams}
            basePath="/admin/general-items"
          />
        </div>
      </div>
    </>
  );
}
