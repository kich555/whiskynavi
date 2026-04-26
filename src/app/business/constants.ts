export const PICKUP_STATUS_LABEL: Record<string, string> = {
  APPLIED: "신청완료",
  CONFIRMED: "확정",
  PAYMENT_COMPLETED: "결제완료",
  WAITING_PICKUP: "픽업대기",
  RECEIVED: "수령완료",
  CANCELLED: "취소",
  REJECTED: "거절",
};

export const PICKUP_STATUS_COLOR: Record<string, string> = {
  APPLIED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  PAYMENT_COMPLETED: "bg-cyan-100 text-cyan-700",
  WAITING_PICKUP: "bg-amber-100 text-amber-700",
  RECEIVED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-gray-200 text-gray-700",
  REJECTED: "bg-red-100 text-red-700",
};

export const PICKUP_STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "APPLIED", label: "신청완료" },
  { value: "CONFIRMED", label: "확정" },
  { value: "PAYMENT_COMPLETED", label: "결제완료" },
  { value: "WAITING_PICKUP", label: "픽업대기" },
  { value: "RECEIVED", label: "수령완료" },
  { value: "CANCELLED", label: "취소" },
  { value: "REJECTED", label: "거절" },
] as const;
