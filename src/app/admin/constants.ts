// Role → 한글 라벨 매핑
export const ROLE_LABEL_MAP: Record<string, string> = {
  ROLE_GUEST: "게스트",
  ROLE_USER: "일반 회원",
  ROLE_ADMIN: "관리자",
  ROLE_SUPER_ADMIN: "총괄 관리자",
  ROLE_CONSUMER: "소비자",
  ROLE_WHISKYNAVI_MEMBER: "내비",
  ROLE_WHISKYTALES_MEMBER: "테일즈",
  ROLE_BLIND_MEMBER: "블라인드 멤버",
  ROLE_BUSINESS: "업장",
  ROLE_TRAILNTALE_BUSINESS: "트레일테일 업장",
  ROLE_COMMUNITY_BUSINESS: "커뮤니티 업장",
  ROLE_PICK_UP_BUSINESS: "픽업 업장",
};

// Role별 Badge 색상
export const ROLE_COLOR_MAP: Record<string, string> = {
  ROLE_SUPER_ADMIN: "bg-red-100 text-red-700",
  ROLE_ADMIN: "bg-red-100 text-red-700",
  ROLE_BUSINESS: "bg-purple-100 text-purple-700",
  ROLE_TRAILNTALE_BUSINESS: "bg-purple-100 text-purple-700",
  ROLE_COMMUNITY_BUSINESS: "bg-purple-100 text-purple-700",
  ROLE_PICK_UP_BUSINESS: "bg-purple-100 text-purple-700",
  ROLE_WHISKYNAVI_MEMBER: "bg-amber-100 text-amber-700",
  ROLE_WHISKYTALES_MEMBER: "bg-blue-100 text-blue-700",
  ROLE_BLIND_MEMBER: "bg-indigo-100 text-indigo-700",
  ROLE_CONSUMER: "bg-gray-100 text-gray-700",
  ROLE_USER: "bg-gray-100 text-gray-700",
  ROLE_GUEST: "bg-gray-100 text-gray-500",
};

// ─── 주문 상태 매핑 ──────────────────────────────────────────
export const ORDER_STATUS_LABEL: Record<string, string> = {
  ORDER_REQUESTED: "주문 요청",
  PAYMENT_PENDING: "결제 대기",
  ORDER_PREPARING: "준비 중",
  SHIPPING: "배송 중",
  DELIVERY_COMPLETED: "배송 완료",
  RECEIPT_PENDING: "수령 대기",
  RECEIPT_COMPLETED: "수령 완료",
  ORDER_CANCELED: "주문 취소",
  REFUND_REQUESTED: "환불 요청",
  REFUND_COMPLETED: "환불 완료",
};

export const ORDER_STATUS_COLOR: Record<string, string> = {
  ORDER_REQUESTED: "bg-blue-100 text-blue-700",
  PAYMENT_PENDING: "bg-yellow-100 text-yellow-700",
  ORDER_PREPARING: "bg-indigo-100 text-indigo-700",
  SHIPPING: "bg-orange-100 text-orange-700",
  DELIVERY_COMPLETED: "bg-green-100 text-green-700",
  RECEIPT_PENDING: "bg-amber-100 text-amber-700",
  RECEIPT_COMPLETED: "bg-green-100 text-green-700",
  ORDER_CANCELED: "bg-gray-200 text-gray-700",
  REFUND_REQUESTED: "bg-red-100 text-red-700",
  REFUND_COMPLETED: "bg-red-100 text-red-700",
};

// ─── 예약 신청 상태 매핑 ──────────────────────────────────────
export const RESERVATION_STATUS_LABEL: Record<string, string> = {
  APPLIED: "신청완료",
  CONFIRMED: "확정",
  CANCELLED: "취소",
  REJECTED: "거절",
  WAITING_PICKUP: "픽업대기",
  RECEIVED: "수령완료",
};

export const RESERVATION_STATUS_COLOR: Record<string, string> = {
  APPLIED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-200 text-gray-700",
  REJECTED: "bg-red-100 text-red-700",
  WAITING_PICKUP: "bg-amber-100 text-amber-700",
  RECEIVED: "bg-emerald-100 text-emerald-700",
};

// 권한 추가 드롭다운에 표시할 역할 (GUEST 제외)
export const ASSIGNABLE_ROLES: string[] = [
  "ROLE_USER",
  "ROLE_ADMIN",
  "ROLE_SUPER_ADMIN",
  "ROLE_CONSUMER",
  "ROLE_WHISKYNAVI_MEMBER",
  "ROLE_WHISKYTALES_MEMBER",
  "ROLE_BLIND_MEMBER",
  "ROLE_BUSINESS",
  "ROLE_TRAILNTALE_BUSINESS",
  "ROLE_COMMUNITY_BUSINESS",
  "ROLE_PICK_UP_BUSINESS",
];
