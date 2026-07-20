"use client";

import type { AdminBottleReservationNoticeResponse } from "@/apis/generated/api";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Eye, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import Pagination from "../../_components/Pagination";
import { getNoticeQuantitySummary } from "../_lib/noticeQuantitySummary";
import { isReservationNoticeEditable } from "../_lib/noticeStatus";
import NoticeStatusBadge from "./NoticeStatusBadge";
import ReservationExcelDownloadLink from "./ReservationExcelDownloadLink";

const formatPeriod = (start?: string, end?: string): string => {
  return `${formatDate(start)} ~ ${formatDate(end)}`;
};

interface ReservationsContentProps {
  searchParams: {
    page?: string;
    limit?: string;
    q?: string;
  };
  notices: AdminBottleReservationNoticeResponse[];
  totalElements: number;
}

export default function ReservationsContent({ searchParams, notices, totalElements }: ReservationsContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;
  const searchQuery = searchParams.q || "";

  const handleSearch = (value: string) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    router.push(`/admin/reservations?${params.toString()}`);
  };

  return (
    <>
      <AdminHeader title="보틀예약관리" onToggleSidebar={toggle} searchQuery={searchQuery} onSearch={handleSearch} />

      <div className="p-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="typo-medium-14 text-gray-600">총 {totalElements}건</p>
          <button
            type="button"
            onClick={() => router.push("/admin/reservations/new")}
            className="typo-medium-14 flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700"
          >
            <Plus size={16} />
            보틀예약공고 등록
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">ID</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">공고명</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">제품명</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">브랜드</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">상태</th>
                  <th className="typo-bold-12 px-4 py-3 text-right text-gray-700 uppercase">가격</th>
                  <th className="typo-bold-12 px-4 py-3 text-center text-gray-700 uppercase">신청 수량</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">수락 수량</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">예약기간</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                      예약 공고가 없습니다.
                    </td>
                  </tr>
                ) : (
                  notices.map((notice) => {
                    const canEditNotice = isReservationNoticeEditable(notice);
                    const quantitySummary = getNoticeQuantitySummary(notice);

                    return (
                      <tr
                        key={notice.id}
                        className="cursor-pointer transition-colors hover:bg-gray-50"
                        onClick={() => router.push(`/admin/reservations/${notice.id}`)}
                      >
                        <td className="typo-medium-14 px-4 py-3 text-gray-900">{notice.id}</td>
                        <td className="typo-medium-14 max-w-[200px] truncate px-4 py-3 text-gray-900">
                          {notice.noticeName || "-"}
                        </td>
                        <td className="typo-medium-14 max-w-[200px] truncate px-4 py-3 text-gray-900">
                          {notice.bottleName}
                        </td>
                        <td className="typo-medium-14 px-4 py-3 text-gray-600">{notice.bottleBrand ?? "-"}</td>
                        <td className="typo-medium-14 px-4 py-3">
                          <NoticeStatusBadge notice={notice} />
                        </td>
                        <td className="typo-medium-14 px-4 py-3 text-right text-gray-900">
                          {formatCurrency(notice.price)}
                        </td>
                        <td className="typo-medium-14 px-4 py-3 text-center">
                          <span className="font-medium text-blue-600">{quantitySummary.appliedQuantity}</span>
                        </td>
                        <td className="typo-medium-14 px-4 py-3">
                          <div className="space-y-0.5 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              총 수락 가능 {quantitySummary.totalAcceptableQuantity}병
                            </div>
                            <div className="typo-medium-12 text-gray-600">
                              현재 수락 {quantitySummary.approvedQuantity}병 · 남은 수락{" "}
                              {quantitySummary.remainingAcceptableQuantity}병
                            </div>
                          </div>
                        </td>
                        <td className="typo-medium-14 px-4 py-3 whitespace-nowrap text-gray-600">
                          {formatPeriod(notice.reservationStartAt, notice.reservationEndAt)}
                        </td>
                        <td className="typo-medium-14 px-4 py-3">
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => router.push(`/admin/reservations/${notice.id}`)}
                              className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                              title="상세"
                            >
                              <Eye size={16} />
                            </button>
                            {canEditNotice && (
                              <button
                                type="button"
                                onClick={() => router.push(`/admin/reservations/${notice.id}/edit`)}
                                className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                                title="수정"
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                            {notice.id != null && <ReservationExcelDownloadLink noticeId={notice.id} compact />}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={totalElements}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            searchParams={searchParams}
            basePath="/admin/reservations"
          />
        </div>
      </div>
    </>
  );
}
