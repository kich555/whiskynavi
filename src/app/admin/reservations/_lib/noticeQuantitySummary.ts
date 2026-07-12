import type { AdminBottleReservationNoticeResponse } from "@/apis/generated/api";

export interface NoticeQuantitySummary {
  appliedQuantity: number;
  approvedQuantity: number;
  remainingAcceptableQuantity: number;
  totalAcceptableQuantity: number;
}

export function getNoticeQuantitySummary(notice: AdminBottleReservationNoticeResponse): NoticeQuantitySummary {
  const appliedQuantity = notice.appliedQuantity ?? 0;
  const approvedQuantity = notice.approvedQuantity ?? 0;
  const remainingAcceptableQuantity = notice.availableQuantity ?? 0;

  return {
    appliedQuantity,
    approvedQuantity,
    remainingAcceptableQuantity,
    totalAcceptableQuantity: approvedQuantity + remainingAcceptableQuantity,
  };
}
