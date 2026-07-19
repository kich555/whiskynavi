"use client";

import type {
  AdminBottleReservationNoticeResponse,
  PutApiAdminBottlesReservationsNoticesNoticeidBodyGradeConditionsItem,
  PutApiAdminBottlesReservationsNoticesNoticeidBodyGradeConditionsItemRequiredRole,
} from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Check, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ROLE_LABEL_MAP } from "../../../constants";
import NoticeStatusBadge from "../../_components/NoticeStatusBadge";
import { getNoticeQuantitySummary } from "../../_lib/noticeQuantitySummary";
import { updateNoticeAvailableQuantityAction } from "../../actions";

interface NoticeInfoSectionProps {
  notice: AdminBottleReservationNoticeResponse;
}

function buildGradeConditions(
  notice: AdminBottleReservationNoticeResponse,
): PutApiAdminBottlesReservationsNoticesNoticeidBodyGradeConditionsItem[] | undefined {
  const conditions = notice.gradeConditions
    ?.filter((condition) => condition.applicableFrom && condition.requiredRole)
    .map(
      (condition): PutApiAdminBottlesReservationsNoticesNoticeidBodyGradeConditionsItem => ({
        applicableFrom: new Date(condition.applicableFrom!).toISOString(),
        requiredRole:
          condition.requiredRole as PutApiAdminBottlesReservationsNoticesNoticeidBodyGradeConditionsItemRequiredRole,
      }),
    );

  return conditions && conditions.length > 0 ? conditions : undefined;
}

export default function NoticeInfoSection({ notice }: NoticeInfoSectionProps) {
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState(String(notice.availableQuantity ?? 0));
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const quantitySummary = getNoticeQuantitySummary(notice);

  const handleCancelQuantityEdit = () => {
    setAvailableQuantity(String(notice.availableQuantity ?? 0));
    setIsEditingQuantity(false);
  };

  const handleSaveQuantity = () => {
    const quantity = Number(availableQuantity);
    if (!Number.isInteger(quantity) || quantity < 0) {
      toast.error("남은 수락 수량은 0 이상의 정수여야 합니다.");
      return;
    }

    if (
      !notice.id ||
      !notice.bottleId ||
      notice.price == null ||
      !notice.reservationStartAt ||
      !notice.reservationEndAt
    ) {
      toast.error("공고 정보를 확인할 수 없습니다.");
      return;
    }

    startTransition(async () => {
      const result = await updateNoticeAvailableQuantityAction({
        noticeId: notice.id!,
        bottleId: notice.bottleId!,
        price: notice.price!,
        reservationStartAt: notice.reservationStartAt!,
        reservationEndAt: notice.reservationEndAt!,
        availableQuantity: quantity,
        maxOrderQuantity: notice.maxOrderQuantity,
        description: notice.description,
        gradeConditions: buildGradeConditions(notice),
      });

      if (result.success) {
        toast.success("남은 수락 수량을 수정했습니다.");
        setIsEditingQuantity(false);
        router.refresh();
        return;
      }

      toast.error(result.error || "남은 수락 수량 수정에 실패했습니다.");
    });
  };

  const quantityFieldValue = isEditingQuantity ? (
    <div className="flex max-w-[220px] items-center gap-2">
      <label className="sr-only" htmlFor="notice-available-quantity">
        남은 수락 수량
      </label>
      <input
        id="notice-available-quantity"
        type="number"
        min={0}
        value={availableQuantity}
        onChange={(event) => setAvailableQuantity(event.target.value)}
        className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
      />
      <Button type="button" size="icon" onClick={handleSaveQuantity} disabled={isPending} title="저장">
        <Check className="size-4" />
        <span className="sr-only">저장</span>
      </Button>
      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={handleCancelQuantityEdit}
        disabled={isPending}
        title="취소"
      >
        <X className="size-4" />
        <span className="sr-only">취소</span>
      </Button>
    </div>
  ) : (
    <span className="inline-flex items-center gap-2">
      <span>{notice.availableQuantity ?? "-"}</span>
      {notice.editable !== false && (
        <button
          type="button"
          onClick={() => setIsEditingQuantity(true)}
          className="inline-flex cursor-pointer items-center rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          title="남은 수락 수량 수정"
        >
          <Pencil className="size-4" />
          <span className="sr-only">남은 수락 수량 수정</span>
        </button>
      )}
    </span>
  );

  const fields: { label: string; value: ReactNode }[] = [
    { label: "공고 ID", value: notice.id },
    { label: "공고명", value: notice.noticeName || "-" },
    { label: "제품명", value: notice.bottleName },
    { label: "브랜드", value: notice.bottleBrand ?? "-" },
    { label: "상태", value: <NoticeStatusBadge notice={notice} /> },
    {
      label: "가격",
      value: formatCurrency(notice.price),
    },
    { label: "예약 시작", value: formatDateTime(notice.reservationStartAt) },
    { label: "예약 종료", value: formatDateTime(notice.reservationEndAt) },
    { label: "총 수락 가능 수량", value: `${quantitySummary.totalAcceptableQuantity}병` },
    { label: "현재 수락한 수량", value: `${quantitySummary.approvedQuantity}병` },
    { label: "남은 수락 수량", value: quantityFieldValue },
    { label: "인당 최대 예약", value: notice.maxOrderQuantity ?? "-" },
    { label: "생성일", value: formatDateTime(notice.createdAt) },
  ];

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 font-bold text-gray-900">공고 정보</h3>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {fields.map((field) => (
          <div key={field.label}>
            <span className="mb-1 block text-xs text-gray-500">{field.label}</span>
            <span className="typo-medium-14 text-gray-900">{field.value}</span>
          </div>
        ))}
      </div>

      {notice.gradeConditions && notice.gradeConditions.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <span className="mb-2 block text-xs text-gray-500">등급 조건</span>
          <div className="flex flex-wrap gap-2">
            {notice.gradeConditions.map((gc, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700"
              >
                {ROLE_LABEL_MAP[gc.requiredRole as keyof typeof ROLE_LABEL_MAP] ?? gc.requiredRole}
                {gc.applicableFrom && <span className="text-amber-500">({formatDateTime(gc.applicableFrom)}~)</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
