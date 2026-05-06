"use client";

import type { BottleReservationPickupNoticeReservationStatusResponse } from "@/apis/generated/api";
import Pagination from "@/app/admin/_components/Pagination";
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
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import BusinessHeader from "../../_components/BusinessHeader";
import { formatCurrency } from "../../utils";
import { bulkWaitingPickupAction } from "../actions";

interface PickupReservationsContentProps {
  searchParams: {
    page?: string;
    limit?: string;
  };
  notices: BottleReservationPickupNoticeReservationStatusResponse[];
  totalElements: number;
}

interface NoticeGroup {
  noticeId: number;
  bottleId?: number;
  bottleName: string;
  bottleImgUrl?: string;
  noticeStatus?: string;
  price?: number;
  totalApplicationCount: number;
  totalConfirmedQuantity: number;
  totalRequestedQuantity: number;
}

const mapNoticesToGroups = (notices: BottleReservationPickupNoticeReservationStatusResponse[]): NoticeGroup[] => {
  return notices.map((notice) => ({
    noticeId: notice.noticeId ?? 0,
    bottleId: notice.bottleId,
    bottleName: notice.bottleName ?? "이름 없는 예약 공고",
    bottleImgUrl: notice.bottleImgUrl,
    noticeStatus: notice.noticeStatus,
    price: notice.price,
    totalApplicationCount: notice.totalApplicationCount ?? 0,
    totalConfirmedQuantity: notice.totalConfirmedQuantity ?? 0,
    totalRequestedQuantity: notice.totalRequestedQuantity ?? 0,
  }));
};

export default function PickupReservationsContent({
  searchParams,
  notices,
  totalElements,
}: PickupReservationsContentProps) {
  const router = useRouter();
  const [bulkNotice, setBulkNotice] = useState<NoticeGroup | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;
  const noticeGroups = mapNoticesToGroups(notices);

  const handleBulkWaitingPickup = () => {
    if (!bulkNotice) return;

    startTransition(async () => {
      const result = await bulkWaitingPickupAction({ noticeId: bulkNotice.noticeId });
      if (result.success) {
        setBulkNotice(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "일괄 처리에 실패했습니다.");
      }
    });
  };

  return (
    <>
      <BusinessHeader title="공고 별 픽업 예약 관리" />

      <div className="p-6">
        <div className="mb-4">
          <p className="text-sm text-gray-600">공고 {totalElements}개</p>
          <p className="mt-1 text-xs text-gray-500">공고별 신청 목록은 상세 화면에서 조회하고 처리합니다.</p>
        </div>

        <Dialog open={bulkNotice != null} onOpenChange={(open) => !open && setBulkNotice(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>공고별 일괄 픽업대기 처리</DialogTitle>
              <DialogDescription>
                <strong>{bulkNotice?.bottleName ?? "선택한 공고"}</strong>의 결제완료 신청을 일괄로 픽업대기 상태로
                변경합니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkNotice(null)} disabled={isPending}>
                취소
              </Button>
              <Button
                onClick={handleBulkWaitingPickup}
                disabled={isPending || !bulkNotice}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                {isPending ? "처리 중..." : "픽업대기 확인"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {noticeGroups.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-500">픽업 예약 공고가 없습니다.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {noticeGroups.map((group) => (
                <section key={group.noticeId} className="px-4 py-4 transition-colors hover:bg-gray-50">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <button
                      type="button"
                      onClick={() => router.push(`/business/pickup-reservations/notices/${group.noticeId}`)}
                      className="min-w-0 cursor-pointer text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-gray-900">{group.bottleName}</h3>
                        <span className="text-xs text-gray-500">공고 #{group.noticeId || "-"}</span>
                        {group.bottleId != null && <span className="text-xs text-gray-500">병 #{group.bottleId}</span>}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {group.noticeStatus && (
                          <Badge className="bg-gray-100 text-gray-700">공고 {group.noticeStatus}</Badge>
                        )}
                        <Badge className="bg-emerald-100 text-emerald-700">단가 {formatCurrency(group.price)}</Badge>
                        <Badge className="bg-gray-100 text-gray-700">신청 {group.totalApplicationCount}건</Badge>
                        <Badge className="bg-blue-100 text-blue-700">요청 {group.totalRequestedQuantity}병</Badge>
                        <Badge className="bg-amber-100 text-amber-700">확정 {group.totalConfirmedQuantity}병</Badge>
                      </div>
                    </button>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/business/pickup-reservations/notices/${group.noticeId}`)}
                      >
                        <Eye size={16} />
                        신청 목록
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setBulkNotice(group)}
                        disabled={isPending || group.totalApplicationCount === 0}
                        className="bg-amber-600 text-white hover:bg-amber-700"
                      >
                        공고 일괄 픽업대기
                      </Button>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )}

          <Pagination
            totalItems={totalElements}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            searchParams={searchParams}
            basePath="/business/pickup-reservations"
            alwaysVisible
          />
        </div>
      </div>
    </>
  );
}
