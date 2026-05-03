"use client";

import type { AdminBusinessApplicationResponse } from "@/apis/generated/api";
import AdminHeader from "@/app/admin/_components/AdminHeader";
import { useSidebar } from "@/app/admin/_components/AdminLayoutClient";
import FilterHeader from "@/app/admin/_components/FilterHeader";
import Pagination from "@/app/admin/_components/Pagination";
import { useTableFilter } from "@/app/admin/_components/useTableFilter";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";

const APPLICATION_STATUS_LABEL: Record<string, string> = {
  PENDING: "검토중",
  APPROVED: "승인",
  REJECTED: "반려",
  CANCELED: "취소",
};

const APPLICATION_STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELED: "bg-gray-100 text-gray-700",
};


const BUSINESS_TYPE_LABEL: Record<string, string> = {
  HOUSEHOLD: "가정용",
  ENTERTAINMENT: "유흥용",
};

const formatBusinessType = (app: AdminBusinessApplicationResponse & { businessType?: string }): string => {
  const businessType = app.businessType;
  if (!businessType) return "-";
  return BUSINESS_TYPE_LABEL[businessType] ?? businessType;
};

const APPLICATION_STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "PENDING", label: "검토중" },
  { value: "APPROVED", label: "승인" },
  { value: "REJECTED", label: "반려" },
  { value: "CANCELED", label: "취소" },
] as const;

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
};

interface BusinessApplicationsContentProps {
  searchParams: {
    page?: string;
    limit?: string;
    status?: string;
  };
  applications: AdminBusinessApplicationResponse[];
  totalElements: number;
}

export default function BusinessApplicationsContent({
  searchParams,
  applications,
  totalElements,
}: BusinessApplicationsContentProps) {
  const router = useRouter();
  const { toggle } = useSidebar();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;

  const { getFilterValue, updateFilter } = useTableFilter({
    searchParams,
    basePath: "/admin/businesses/applications",
  });

  return (
    <>
      <AdminHeader
        title="사업자 신청 관리"
        onToggleSidebar={toggle}
        showSearch={false}
      />

      <div className="p-8">
        <div className="mb-4">
          <p className="text-sm text-gray-600">총 {totalElements}건</p>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">
                    ID
                  </th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">
                    업체명
                  </th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">
                    대표자
                  </th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">

                    사업자 구분
                  </th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">
                    연락처
                  </th>
                  <FilterHeader
                    label="상태"
                    filterKey="status"
                    options={APPLICATION_STATUS_OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                    currentValue={getFilterValue("status")}
                    onSelect={updateFilter}
                    dropdownWidth="w-28"
                  />
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">
                    신청일
                  </th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      사업자 신청이 없습니다.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr
                      key={app.id}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                      onClick={() =>
                        router.push(
                          `/admin/businesses/applications/${app.id}`,
                        )
                      }
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {app.id}
                      </td>
                      <td className="typo-medium-14 max-w-[200px] truncate px-4 py-3 text-gray-900">
                        {app.businessName ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {app.representativeName ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatBusinessType(app)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {app.contact ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge
                          className={
                            APPLICATION_STATUS_COLOR[app.status ?? ""] ??
                            "bg-gray-100 text-gray-700"
                          }
                        >
                          {APPLICATION_STATUS_LABEL[app.status ?? ""] ??
                            app.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600">
                        {formatDate(app.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/admin/businesses/applications/${app.id}`,
                              )
                            }
                            className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                            title="상세"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
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
            basePath="/admin/businesses/applications"
          />
        </div>
      </div>
    </>
  );
}
