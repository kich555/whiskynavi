export const INQUIRY_STATUS_LABEL: Record<string, string> = {
  WAITING: "답변 대기",
  ANSWERED: "답변 완료",
  CLOSED: "문의 종료",
};

export const USER_INQUIRY_STATUS_COLOR: Record<string, string> = {
  WAITING: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  ANSWERED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  CLOSED: "border-white/15 bg-white/5 text-gray-400",
};
