"use client";

import type { BottleReservationPickupApplicationResponse } from "@/apis/generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import FilterHeader from "../../_components/FilterHeader";
import Pagination from "../../_components/Pagination";
import { useTableFilter } from "../../_components/useTableFilter";
import {
  RESERVATION_STATUS_COLOR,
  RESERVATION_STATUS_LABEL,
} from "../../constants";
import { bulkWaitingPickupAction } from "../actions";

const STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "APPLIED", label: "신청완료" },
  { value: "CONFIRMED", label: "확정" },
  { value: "PAYMENT_COMPLETED", label: "결제완료" },
  { value: "WAITING_PICKUP", label: "픽업대기" },
  { value: "RECEIVED", label: "수령완료" },
  { value: "CANCELLED", label: "취소" },
  { value: "REJECTED", label: "거절" },
];

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

interface PickupReservationsContentProps {
  searchParams: {
    page?: string;
    limit?: string;
    status?: string;
  };
  applications: BottleReservationPickupApplicationResponse[];
  totalElements: number;
}

export default function PickupReservationsContent({
  searchParams,
  applications,
  totalElements,
}: PickupReservationsContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;

  const { getFilterValue, updateFilter } = useTableFilter({
    searchParams,
    basePath: "/admin/pickup-reservations",
  });

  const paymentCompletedApps = applications.filter(
    (app) => app.status === "PAYMENT_COMPLETED",
  );

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (
      paymentCompletedApps.length > 0 &&
      paymentCompletedApps.every((app) => selectedIds.has(app.id!))
    ) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paymentCompletedApps.map((app) => app.id!)));
    }
  };

  const isAllSelected =
    paymentCompletedApps.length > 0 &&
    paymentCompletedApps.every((app) => selectedIds.has(app.id!));

  const handleBulkWaitingPickup = () => {
    startTransition(async () => {
      const result = await bulkWaitingPickupAction([...selectedIds]);
      if (result.success) {
        setSelectedIds(new Set());
        setIsBulkDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "일괄 처리에 실패했습니다.");
      }
    });
  };

  return (
    <>
      <AdminHeader
        title="픽업 예약 관리"
        onToggleSidebar={toggle}
        showSearch={false}
      />

      <div className="p-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">총 {totalElements}건</p>

          {selectedIds.size > 0 && (
            <Button
              type="button"
              onClick={() => setIsBulkDialogOpen(true)}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              일괄 픽업대기 처리 ({selectedIds.size}건)
            </Button>
          )}
        </div>

        <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>일괄 픽업대기 처리</DialogTitle>
              <DialogDescription>
                선택한 <strong>{selectedIds.size}건</strong>의 신청을 픽업대기
                상태로 변경합니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsBulkDialogOpen(false)}
                disabled={isPending}
              >
                취소
              </Button>
              <Button
                onClick={handleBulkWaitingPickup}
                disabled={isPending}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                {isPending ? "처리 중..." : "픽업대기 확인"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={() => toggleSelectAll()}
                      disabled={paymentCompletedApps.length === 0}
                      aria-label="전체 선택"
                    />
                  </th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">
                    ID
                  </th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">
                    병 이름
                  </th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">
                    신청자
                  </th>
                  <th className="typo-bold-12 px-4 py-3 text-center text-gray-700 uppercase">
                    신청수량
                  </th>
                  <th className="typo-bold-12 px-4 py-3 text-center text-gray-700 uppercase">
                    확정수량
                  </th>
                  <FilterHeader
                    label="상태"
                    filterKey="status"
                    options={STATUS_OPTIONS}
                    currentValue={getFilterValue("status")}
                    onSelect={updateFilter}
                    dropdownWidth="w-36"
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
                      colSpan={9}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      픽업 예약 신청이 없습니다.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr
                      key={app.id}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                      onClick={() =>
                        router.push(`/admin/pickup-reservations/${app.id}`)
                      }
                    >
                      <td
                        className="w-10 px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {app.status === "PAYMENT_COMPLETED" && (
                          <Checkbox
                            checked={selectedIds.has(app.id!)}
                            onCheckedChange={() => toggleSelect(app.id!)}
                            aria-label={`${app.id} 선택`}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {app.id}
                      </td>
                      <td className="typo-medium-14 max-w-[200px] truncate px-4 py-3 text-gray-900">
                        {app.bottleName ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {app.applicantUser?.name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900">
                        {app.quantity ?? "-"}
                      </td>
                      <td className="typo-medium-14 px-4 py-3 text-center text-amber-600">
                        {app.confirmedQuantity ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge
                          className={
                            RESERVATION_STATUS_COLOR[app.status ?? ""] ??
                            "bg-gray-100 text-gray-700"
                          }
                        >
                          {RESERVATION_STATUS_LABEL[app.status ?? ""] ??
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
                                `/admin/pickup-reservations/${app.id}`,
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
            basePath="/admin/pickup-reservations"
          />
        </div>
      </div>
    </>
  );
}
