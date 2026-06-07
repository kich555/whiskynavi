"use client";

import type { AdminSaleAnnouncementResponse } from "@/apis/generated/api";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import Pagination from "../../_components/Pagination";

const SALE_STATUS_LABEL: Record<string, string> = {
  DRAFT: "임시저장",
  OPEN: "판매중",
  CLOSED: "판매종료",
  SOLD_OUT: "품절",
};

const SALE_STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-green-100 text-green-700",
  CLOSED: "bg-slate-100 text-slate-700",
  SOLD_OUT: "bg-red-100 text-red-700",
};

interface GeneralItemSalesContentProps {
  searchParams: {
    page?: string;
    limit?: string;
    saleStatus?: string;
  };
  sales: AdminSaleAnnouncementResponse[];
  totalElements: number;
}


function buildOrderHref(sale: AdminSaleAnnouncementResponse) {
  return sale.id != null ? `/general-items/${sale.id}` : "/general-items";
}

export default function GeneralItemSalesContent({ searchParams, sales, totalElements }: GeneralItemSalesContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 50;

  const updateStatusFilter = (saleStatus: string) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    if (saleStatus) {
      params.set("saleStatus", saleStatus);
    } else {
      params.delete("saleStatus");
    }
    params.set("page", "1");
    router.push(`/admin/general-item-sales?${params.toString()}`);
  };

  return (
    <>
      <AdminHeader title="일반상품판매공고관리" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-600">
              현재 페이지 일반상품판매공고 {totalElements.toLocaleString("ko-KR")}건
            </p>
            <select
              value={searchParams.saleStatus ?? ""}
              onChange={(event) => updateStatusFilter(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="">전체 상태</option>
              {Object.entries(SALE_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/admin/general-item-sales/new"
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
          >
            <Plus size={16} />
            일반상품판매공고 등록
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">공고 ID</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">제목</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">상품</th>
                  <th className="typo-bold-12 px-4 py-3 text-right text-gray-700 uppercase">판매가</th>
                  <th className="typo-bold-12 px-4 py-3 text-center text-gray-700 uppercase">수량</th>
                  <th className="typo-bold-12 px-4 py-3 text-center text-gray-700 uppercase">상태</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">판매기간</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">확인</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                      일반상품판매공고가 없습니다.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{sale.id ?? "-"}</td>
                      <td className="px-4 py-3">
                        <p className="typo-medium-14 max-w-[240px] truncate text-gray-900">{sale.title ?? "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{sale.itemName ?? sale.productId ?? "-"}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(sale.salePrice)}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {(sale.availableQuantity ?? 0).toLocaleString("ko-KR")} /{" "}
                        {(sale.totalQuantity ?? 0).toLocaleString("ko-KR")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            SALE_STATUS_COLOR[sale.saleStatus ?? ""] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {SALE_STATUS_LABEL[sale.saleStatus ?? ""] ?? sale.saleStatus ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600">
                        {formatDateTime(sale.saleStartAt)} ~ {formatDateTime(sale.saleEndAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={buildOrderHref(sale)}
                          className="rounded-md px-2 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
                        >
                          상품 화면
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
            basePath="/admin/general-item-sales"
          />
        </div>
      </div>
    </>
  );
}
