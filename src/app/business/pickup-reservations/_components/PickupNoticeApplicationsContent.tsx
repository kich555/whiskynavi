"use client";

import type { BottleReservationPickupApplicationResponse } from "@/apis/generated/api";
import FilterHeader from "@/app/admin/_components/FilterHeader";
import Pagination from "@/app/admin/_components/Pagination";
import { useTableFilter } from "@/app/admin/_components/useTableFilter";
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
import { ArrowLeft, CheckCircle2, CreditCard, Eye, PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import BusinessHeader from "../../_components/BusinessHeader";
import { PICKUP_STATUS_COLOR, PICKUP_STATUS_LABEL, PICKUP_STATUS_OPTIONS } from "../../constants";
import { formatCurrency, formatDate } from "../../utils";
import { bulkWaitingPickupAction, paymentCompleteAction, receiveCompleteAction, waitingPickupAction } from "../actions";

interface PickupNoticeApplicationsContentProps {
  noticeId: number;
  searchParams: {
    page?: string;
    limit?: string;
    status?: string;
  };
  applications: BottleReservationPickupApplicationResponse[];
  totalElements: number;
}

type ActionType = "payment-complete" | "waiting-pickup" | "receive-complete";
type BulkTarget =
  | {
      type: "notice";
    }
  | {
      type: "selected";
      applicationIds: number[];
    };

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
    description: "신청을 결제완료 상태로 변경합니다.",
  },
  "waiting-pickup": {
    label: "픽업대기 처리",
    confirmLabel: "픽업대기 확인",
    className: "bg-amber-600 text-white hover:bg-amber-700",
    description: "신청을 픽업대기 상태로 변경합니다.",
  },
  "receive-complete": {
    label: "수령완료 처리",
    confirmLabel: "수령완료 확인",
    className: "bg-emerald-600 text-white hover:bg-emerald-700",
    description: "신청을 수령완료 상태로 변경합니다.",
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
              {applicantName && <strong>{applicantName}</strong>}의 {config.description}
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

export default function PickupNoticeApplicationsContent({
  noticeId,
  searchParams,
  applications,
  totalElements,
}: PickupNoticeApplicationsContentProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkTarget, setBulkTarget] = useState<BulkTarget | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;
  const bottleName = applications[0]?.bottleName ?? `공고 #${noticeId}`;
  const paymentCompletedApps = applications.filter((app) => app.status === "PAYMENT_COMPLETED" && app.id != null);
  const isAllSelected =
    paymentCompletedApps.length > 0 && paymentCompletedApps.every((app) => selectedIds.has(app.id!));
  const selectedCount = bulkTarget?.type === "selected" ? bulkTarget.applicationIds.length : 0;

  const { getFilterValue, updateFilter } = useTableFilter({
    searchParams,
    basePath: `/business/pickup-reservations/notices/${noticeId}`,
  });

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
    setSelectedIds((prev) => {
      const next = new Set(prev);
      paymentCompletedApps.forEach((app) => {
        if (isAllSelected) {
          next.delete(app.id!);
        } else {
          next.add(app.id!);
        }
      });
      return next;
    });
  };

  const handleBulkWaitingPickup = () => {
    if (!bulkTarget) return;

    startTransition(async () => {
      const result =
        bulkTarget.type === "notice"
          ? await bulkWaitingPickupAction({ noticeId })
          : await bulkWaitingPickupAction({ applicationIds: bulkTarget.applicationIds });

      if (result.success) {
        if (bulkTarget.type === "selected") {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            bulkTarget.applicationIds.forEach((id) => next.delete(id));
            return next;
          });
        }
        setBulkTarget(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "일괄 처리에 실패했습니다.");
      }
    });
  };

  const openSelectedBulkDialog = () => {
    setBulkTarget({
      type: "selected",
      applicationIds: applications
        .filter((app) => app.id && selectedIds.has(app.id))
        .map((app) => app.id!)
        .filter((id) => id > 0),
    });
  };

  return (
    <>
      <BusinessHeader title="공고별 예약 신청 관리" />

      <div className="p-6">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push("/business/pickup-reservations")}
            className="flex cursor-pointer items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            공고 목록으로 돌아가기
          </button>
        </div>

        <Dialog open={bulkTarget != null} onOpenChange={(open) => !open && setBulkTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>공고별 일괄 픽업대기 처리</DialogTitle>
              <DialogDescription>
                <strong>{bottleName}</strong>의{" "}
                {bulkTarget?.type === "selected" ? (
                  <>
                    선택된 신청 <strong>{selectedCount}건</strong>을 픽업대기 상태로 변경합니다.
                  </>
                ) : (
                  <>결제완료 신청을 일괄로 픽업대기 상태로 변경합니다.</>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkTarget(null)} disabled={isPending}>
                취소
              </Button>
              <Button
                onClick={handleBulkWaitingPickup}
                disabled={isPending || !bulkTarget || (bulkTarget.type === "selected" && selectedCount === 0)}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                {isPending ? "처리 중..." : "픽업대기 확인"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">{bottleName}</h2>
            <p className="mt-1 text-sm text-gray-600">
              공고 #{noticeId} 신청 {totalElements}건
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() => setBulkTarget({ type: "notice" })}
              disabled={isPending || totalElements === 0}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              공고 일괄 픽업대기
            </Button>
            {selectedIds.size > 0 && (
              <Button
                type="button"
                onClick={openSelectedBulkDialog}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                선택 일괄 픽업대기 ({selectedIds.size}건)
              </Button>
            )}
          </div>
        </div>

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
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">신청 ID</th>
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
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">처리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                      해당 조건의 예약 신청이 없습니다.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="transition-colors hover:bg-gray-50">
                      <td className="w-10 px-4 py-3">
                        {app.status === "PAYMENT_COMPLETED" && (
                          <Checkbox
                            checked={selectedIds.has(app.id!)}
                            onCheckedChange={() => toggleSelect(app.id!)}
                            aria-label={`${app.id} 선택`}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{app.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="font-medium text-gray-900">{app.applicantUser?.name ?? "-"}</div>
                        <div className="text-xs text-gray-500">{app.applicantUser?.phone ?? "-"}</div>
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
            basePath={`/business/pickup-reservations/notices/${noticeId}`}
            alwaysVisible
          />
        </div>

        <div className="mt-3 grid gap-2 text-xs text-gray-500 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <CreditCard size={14} />
            확정 신청은 결제완료 처리할 수 있습니다.
          </div>
          <div className="flex items-center gap-2">
            <PackageCheck size={14} />
            결제완료 신청은 픽업대기로 변경할 수 있습니다.
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} />
            픽업대기 신청은 수령완료 처리할 수 있습니다.
          </div>
        </div>
      </div>
    </>
  );
}
