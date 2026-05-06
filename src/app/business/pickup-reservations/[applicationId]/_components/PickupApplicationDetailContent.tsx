"use client";

import type { BottleReservationPickupApplicationResponse } from "@/apis/generated/api";
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
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import BusinessHeader from "../../../_components/BusinessHeader";
import { PICKUP_STATUS_COLOR, PICKUP_STATUS_LABEL } from "../../../constants";
import { formatCurrency, formatDate } from "../../../utils";
import { paymentCompleteAction, receiveCompleteAction, waitingPickupAction } from "../../actions";

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
      <div className="flex justify-end">
        <Button type="button" onClick={() => setIsOpen(true)} className={config.className}>
          {config.label}
        </Button>
      </div>

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

interface PickupApplicationDetailContentProps {
  application: BottleReservationPickupApplicationResponse;
}

export default function PickupApplicationDetailContent({ application }: PickupApplicationDetailContentProps) {
  const router = useRouter();

  return (
    <>
      <BusinessHeader title="픽업 예약 상세" />

      <div className="p-6">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push("/business/pickup-reservations")}
            className="flex cursor-pointer items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            픽업 예약 목록으로 돌아가기
          </button>
        </div>

        <div className="space-y-4">
          <StatusActionButton
            applicationId={application.id!}
            status={application.status}
            applicantName={application.applicantUser?.name ?? undefined}
          />
          {/* 병 정보 */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="font-bold text-gray-900">병 정보</h3>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-6">
                {application.bottleImgUrl && (
                  <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-gray-200">
                    <Image
                      src={application.bottleImgUrl}
                      alt={application.bottleName ?? "병 이미지"}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">신청 ID</p>
                    <p className="text-sm font-medium text-gray-900">{application.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">공고 ID</p>
                    <p className="text-sm font-medium text-gray-900">{application.noticeId ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">병 이름</p>
                    <p className="text-sm font-medium text-gray-900">{application.bottleName ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">병 ID</p>
                    <p className="text-sm font-medium text-gray-900">{application.bottleId ?? "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 신청 정보 */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="font-bold text-gray-900">신청 정보</h3>
            </div>
            <div className="grid grid-cols-2 gap-6 p-6 md:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">상태</p>
                <div className="mt-1">
                  <Badge className={PICKUP_STATUS_COLOR[application.status ?? ""] ?? "bg-gray-100 text-gray-700"}>
                    {PICKUP_STATUS_LABEL[application.status ?? ""] ?? application.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">신청수량</p>
                <p className="text-sm font-medium text-gray-900">{application.quantity ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">확정수량</p>
                <p className="text-sm font-medium text-amber-600">{application.confirmedQuantity ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">단가</p>
                <p className="text-sm font-medium text-gray-900">{formatCurrency(application.unitPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">총액</p>
                <p className="text-sm font-medium text-gray-900">{formatCurrency(application.totalPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">신청일</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(application.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">수정일</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(application.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* 신청자 정보 */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="font-bold text-gray-900">신청자 정보</h3>
            </div>
            <div className="grid grid-cols-2 gap-6 p-6 md:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">이름</p>
                <p className="text-sm font-medium text-gray-900">{application.applicantUser?.name ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">닉네임</p>
                <p className="text-sm font-medium text-gray-900">{application.applicantUser?.nickname ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">이메일</p>
                <p className="text-sm font-medium text-gray-900">{application.applicantUser?.email ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">전화번호</p>
                <p className="text-sm font-medium text-gray-900">{application.applicantUser?.phone ?? "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
