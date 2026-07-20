"use client";

import type { AdminInquirySummaryResponse } from "@/apis/generated/api";
import AdminHeader from "@/app/admin/_components/AdminHeader";
import { useSidebar } from "@/app/admin/_components/AdminLayoutClient";
import Pagination from "@/app/admin/_components/Pagination";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/formatters";
import { Eye, MessageCircleQuestion } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AdminInquiriesSearchParams } from "../page";

const STATUS_LABEL: Record<string, string> = {
  WAITING: "답변 대기",
  ANSWERED: "답변 완료",
  CLOSED: "문의 종료",
};

const STATUS_COLOR: Record<string, string> = {
  WAITING: "border-amber-200 bg-amber-50 text-amber-700",
  ANSWERED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CLOSED: "border-gray-200 bg-gray-100 text-gray-600",
};

interface AdminInquiriesContentProps {
  searchParams: AdminInquiriesSearchParams;
  inquiries: AdminInquirySummaryResponse[];
  totalElements: number;
}

export default function AdminInquiriesContent({ searchParams, inquiries, totalElements }: AdminInquiriesContentProps) {
  const router = useRouter();
  const { toggle } = useSidebar();
  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    params.set("page", "1");
    params.set("limit", String(itemsPerPage));
    router.push(`/admin/inquiries?${params.toString()}`);
  };

  return (
    <>
      <AdminHeader title="1:1 문의 관리" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-4 md:p-8">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="typo-medium-14 text-gray-600">총 {totalElements}건</p>
          <Select value={searchParams.status ?? "ALL"} onValueChange={handleStatusChange}>
            <SelectTrigger aria-label="문의 상태" className="w-full bg-white sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체 상태</SelectItem>
              <SelectItem value="WAITING">답변 대기</SelectItem>
              <SelectItem value="ANSWERED">답변 완료</SelectItem>
              <SelectItem value="CLOSED">문의 종료</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left typo-bold-12 text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left typo-bold-12 text-gray-700">사용자</th>
                  <th className="px-4 py-3 text-left typo-bold-12 text-gray-700">제목</th>
                  <th className="px-4 py-3 text-left typo-bold-12 text-gray-700">상태</th>
                  <th className="px-4 py-3 text-left typo-bold-12 text-gray-700">최근 메시지</th>
                  <th className="px-4 py-3 text-left typo-bold-12 text-gray-700">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-gray-500">
                      <MessageCircleQuestion className="mx-auto mb-3 size-9 text-gray-300" />
                      해당 상태의 문의가 없습니다.
                    </td>
                  </tr>
                ) : (
                  inquiries.map((inquiry) => (
                    <tr
                      key={inquiry.id}
                      onClick={() => router.push(`/admin/inquiries/${inquiry.id}`)}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 typo-medium-14 text-gray-700">{inquiry.id}</td>
                      <td className="px-4 py-4 typo-medium-14 text-gray-700">#{inquiry.userId}</td>
                      <td className="max-w-xs px-4 py-4 typo-medium-14 text-gray-900">
                        <span className="block truncate">{inquiry.title ?? "제목 없음"}</span>
                      </td>
                      <td className="px-4 py-4 typo-medium-14">
                        <Badge variant="outline" className={STATUS_COLOR[inquiry.status ?? ""] ?? STATUS_COLOR.CLOSED}>
                          {STATUS_LABEL[inquiry.status ?? ""] ?? inquiry.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 typo-medium-14 whitespace-nowrap text-gray-600">
                        {formatDateTime(inquiry.lastMessageAt)}
                      </td>
                      <td className="px-4 py-4 typo-medium-14">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(`/admin/inquiries/${inquiry.id}`);
                          }}
                          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-amber-50 hover:text-amber-700"
                          aria-label={`${inquiry.title ?? "문의"} 상세 보기`}
                        >
                          <Eye className="size-4" />
                        </button>
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
            basePath="/admin/inquiries"
          />
        </div>
      </div>
    </>
  );
}
