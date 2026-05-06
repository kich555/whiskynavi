"use client";

import type { BottleReservationPickupApplicationResponse } from "@/apis/generated/api";
import FilterHeader from "@/app/admin/_components/FilterHeader";
import Pagination from "@/app/admin/_components/Pagination";
import { useTableFilter } from "@/app/admin/_components/useTableFilter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import BusinessHeader from "../../_components/BusinessHeader";
import { PICKUP_STATUS_COLOR, PICKUP_STATUS_LABEL, PICKUP_STATUS_OPTIONS } from "../../constants";
import { formatCurrency, formatDate } from "../../utils";
import { paymentCompleteAction, receiveCompleteAction, waitingPickupAction } from "../actions";

interface PickupReservationApplicationsContentProps {
  searchParams: {
    page?: string;
    limit?: string;
    status?: string;
    q?: string;
    searchType?: string;
  };
  applications: BottleReservationPickupApplicationResponse[];
  totalElements: number;
}

type ActionType = "payment-complete" | "waiting-pickup" | "receive-complete";

const ACTION_CONFIG: Record<
  ActionType,
  {
    label: string;
    confirmLabel: string;
    className: string;
    description: string;
  }
> = {
  "payment-complete": {
    label: "결제완료 처리",
    confirmLabel: "결제완료 확인",
    className: "bg-cyan-600 text-white hover:bg-cyan-700",
    description: "이 신청을 결제완료 상태로 변경합니다.",
  },
  "waiting-pickup": {
    label: "픽업대기 처리",
    confirmLabel: "픽업대기 확인",
    className: "bg-amber-600 text-white hover:bg-amber-700",
    description: "이 신청을 픽업대기 상태로 변경합니다.",
  },
  "receive-complete": {
    label: "수령완료 처리",
    confirmLabel: "수령완료 확인",
    className: "bg-emerald-600 text-white hover:bg-emerald-700",
    description: "이 신청을 수령완료 상태로 변경합니다.",
  },
};

const STATUS_TO_ACTION: Record<string, ActionType> = {
  CONFIRMED: "payment-complete",
  PAYMENT_COMPLETED: "waiting-pickup",
  WAITING_PICKUP: "receive-complete",
};

interface StatusActionButtonProps {
  applicationId: number;
  status?: string;
  applicantName?: string;
}

function StatusActionButton({ applicationId, status, applicantName }: StatusActionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const actionType = status ? STATUS_TO_ACTION[status] : undefined;
  if (!actionType) return null;

  const config = ACTION_CONFIG[actionType];

  const handleConfirm = () => {
    startTransition(async () => {
      let result: { success: boolean; error?: string };

      if (actionType === "payment-complete") {
        result = await paymentCompleteAction(applicationId);
      } else if (actionType === "waiting-pickup") {
        result = await waitingPickupAction(applicationId);
      } else {
        result = await receiveCompleteAction(applicationId);
      }

      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "처리에 실패했습니다.");
      }
    });
  };

  return (
    <>
      <Button type="button" size="sm" onClick={() => setIsOpen(true)} className={config.className}>
        {config.label}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{config.label}</DialogTitle>
            <DialogDescription>
              {applicantName && <strong>{applicantName}</strong>}님의 신청을 {config.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
              취소
            </Button>
            <Button onClick={handleConfirm} disabled={isPending} className={config.className}>
              {isPending ? "처리 중..." : config.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function PickupReservationApplicationsContent({
  searchParams,
  applications,
  totalElements,
}: PickupReservationApplicationsContentProps) {
  const router = useRouter();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;

  const { getFilterValue, updateFilter } = useTableFilter({
    searchParams,
    basePath: "/business/pickup-reservations/applications",
  });

  const handleSearch = (formData: FormData) => {
    const keyword = String(formData.get("q") ?? "").trim();
    const params = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "page" && key !== "q") params.set(key, value);
    });

    if (keyword) params.set("q", keyword);
    params.set("searchType", String(formData.get("searchType") ?? "userName"));
    params.set("page", "1");
    router.push(`/business/pickup-reservations/applications?${params.toString()}`);
  };

  const clearSearch = () => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "page" && key !== "q" && key !== "searchType") params.set(key, value);
    });
    params.set("page", "1");
    router.push(`/business/pickup-reservations/applications?${params.toString()}`);
  };

  return (
    <>
      <BusinessHeader title="예약 건 별 조회" />

      <div className="p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-600">총 {totalElements}건</p>
          <form action={handleSearch} className="flex w-full gap-2 md:w-[560px]">
            <select
              name="searchType"
              defaultValue={searchParams.searchType ?? "userName"}
              className="w-28 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none"
            >
              <option value="userName">실명</option>
              <option value="nickname">별명</option>
              <option value="phone">전화번호</option>
            </select>
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
              />
              <input
                name="q"
                defaultValue={searchParams.q ?? ""}
                className="w-full rounded-md border border-gray-300 bg-white py-2 pr-9 pl-9 text-sm text-gray-900 focus:border-amber-500 focus:outline-none"
                placeholder="별명, 실명, 전화번호 검색"
              />
              {searchParams.q && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  title="검색어 지우기"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <Button type="submit" className="bg-gray-900 text-white hover:bg-gray-800">
              검색
            </Button>
          </form>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">공고 ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">병 이름</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">신청자</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">신청수량</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">확정수량</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">단가</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">총액</th>
                  <FilterHeader
                    label="상태"
                    filterKey="status"
                    options={PICKUP_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                    currentValue={getFilterValue("status")}
                    onSelect={updateFilter}
                    dropdownWidth="w-36"
                  />
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">신청일</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                      픽업 예약 신청이 없습니다.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{app.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{app.noticeId ?? "-"}</td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-sm font-medium text-gray-900">
                        {app.bottleName ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="font-medium text-gray-900">실명: {app.applicantUser?.name ?? "-"}</div>
                        <div className="text-xs text-gray-500">별명: {app.applicantUser?.nickname ?? "-"}</div>
                        <div className="text-xs text-gray-500">전화: {app.applicantUser?.phone ?? "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900">{app.quantity ?? "-"}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-amber-600">
                        {app.confirmedQuantity ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm whitespace-nowrap text-gray-900">
                        {formatCurrency(app.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium whitespace-nowrap text-gray-900">
                        {formatCurrency(app.totalPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className={PICKUP_STATUS_COLOR[app.status ?? ""] ?? "bg-gray-100 text-gray-700"}>
                          {PICKUP_STATUS_LABEL[app.status ?? ""] ?? app.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600">{formatDate(app.createdAt)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusActionButton
                            applicationId={app.id!}
                            status={app.status}
                            applicantName={app.applicantUser?.name ?? undefined}
                          />
                          <button
                            type="button"
                            onClick={() => router.push(`/business/pickup-reservations/${app.id}`)}
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
            basePath="/business/pickup-reservations/applications"
            alwaysVisible
          />
        </div>
      </div>
    </>
  );
}
