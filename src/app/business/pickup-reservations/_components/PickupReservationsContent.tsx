"use client";

import type {
  UserBottleReservationPickupNoticeReservationStatusResponse,
  UserReservationBusinessDeliveryResponse,
} from "@/apis/generated/api";
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
  notices: UserBottleReservationPickupNoticeReservationStatusResponse[];
  totalElements: number;
  deliveries: UserReservationBusinessDeliveryResponse[];
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

const mapNoticesToGroups = (notices: UserBottleReservationPickupNoticeReservationStatusResponse[]): NoticeGroup[] => {
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

const formatTrackingNumber = (delivery?: UserReservationBusinessDeliveryResponse) => {
  if (delivery?.deliveryMethod === "PRIVATE_CARGO") return "해당 없음 (용달)";
  return delivery?.trackingNumber?.trim() || "-";
};

export default function PickupReservationsContent({
  searchParams,
  notices,
  totalElements,
  deliveries,
}: PickupReservationsContentProps) {
  const router = useRouter();
  const [bulkNotice, setBulkNotice] = useState<NoticeGroup | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;
  const noticeGroups = mapNoticesToGroups(notices);
  const deliveryMap = new Map(deliveries.map((delivery) => [delivery.noticeId, delivery]));

  const handleBulkWaitingPickup = () => {
    if (!bulkNotice) return;
    if (bulkNotice.bottleId == null) {
      toast.error("일괄 처리할 병 정보를 찾을 수 없습니다.");
      return;
    }

    startTransition(async () => {
      const result = await bulkWaitingPickupAction({
        bottleId: bulkNotice.bottleId,
        noticeId: bulkNotice.noticeId,
      });
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
          <p className="mt-1 text-xs text-gray-500">공고별 신청 내역은 상세조회 화면에서 확인하고 처리합니다.</p>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">공고</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">공고상태</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">단가</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">신청</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">요청</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">확정</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">송장번호</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {noticeGroups.map((group) => {
                    const delivery = deliveryMap.get(group.noticeId);

                    return (
                      <tr key={group.noticeId} className="transition-colors hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => router.push(`/business/pickup-reservations/notices/${group.noticeId}`)}
                            className="min-w-0 cursor-pointer text-left"
                          >
                            <div className="text-sm font-bold text-gray-900">{group.bottleName}</div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                              <span>공고 #{group.noticeId || "-"}</span>
                              {group.bottleId != null && <span>병 #{group.bottleId}</span>}
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {group.noticeStatus ? (
                            <Badge className="bg-gray-100 text-gray-700">공고 {group.noticeStatus}</Badge>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm whitespace-nowrap text-gray-900">
                          {formatCurrency(group.price)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">{group.totalApplicationCount}건</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">
                          {group.totalRequestedQuantity}병
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-medium text-amber-600">
                          {group.totalConfirmedQuantity}병
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-900">
                          {formatTrackingNumber(delivery)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/business/pickup-reservations/notices/${group.noticeId}`)}
                            >
                              <Eye size={16} />
                              상세조회
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setBulkNotice(group)}
                              disabled={isPending || group.totalApplicationCount === 0 || group.bottleId == null}
                              className="bg-amber-600 text-white hover:bg-amber-700"
                            >
                              공고 일괄 픽업대기
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
