import type { NoticeStatus } from "../_lib/utils";
import { formatDateTime } from "../_lib/utils";

interface TimerDisplayProps {
  status: NoticeStatus;
  timeRemaining: string;
  reservationStartAt?: string;
  reservationEndAt?: string;
}

const timerConfig = {
  pending: {
    label: "예약 시작",
    borderClass: "border-orange-600/30",
    bgClass: "bg-orange-600/20",
    labelClass: "text-orange-400",
    subClass: "text-orange-400/70",
  },
  active: {
    label: "예약 마감",
    borderClass: "border-blue-600/30",
    bgClass: "bg-blue-600/20",
    labelClass: "text-blue-400",
    subClass: "text-blue-400/70",
  },
  applied: {
    label: "예약신청완료",
    borderClass: "border-green-600/30",
    bgClass: "bg-green-600/20",
    labelClass: "text-green-400",
    subClass: "text-green-400/70",
  },
  closed: {
    label: "예약 종료됨",
    borderClass: "border-gray-600/30",
    bgClass: "bg-gray-600/20",
    labelClass: "text-gray-400",
    subClass: "text-gray-300",
  },
} as const;

export default function TimerDisplay({
  status,
  timeRemaining,
  reservationStartAt,
  reservationEndAt,
}: TimerDisplayProps) {
  const config = timerConfig[status];
  const dateStr = status === "pending" ? reservationStartAt : reservationEndAt;

  if (status === "closed" || status === "applied") {
    return (
      <div className={`border ${config.borderClass} ${config.bgClass} p-3 lg:p-4`}>
        <div className="flex items-center justify-between">
          <p className={`typo-bold-14 lg:text-base ${config.labelClass}`}>{config.label}</p>
          <p className={`text-xs ${config.subClass}`}>{formatDateTime(reservationEndAt)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border ${config.borderClass} ${config.bgClass} p-3 lg:p-4`}>
      <div className="mb-2 flex flex-col items-start gap-1 lg:flex-row lg:items-start lg:justify-between">
        <p className={`typo-bold-14 lg:text-base ${config.labelClass}`}>{config.label}</p>
        <p className={`text-xs ${config.subClass}`}>{formatDateTime(dateStr)}</p>
      </div>
      <div className="flex items-center justify-end">
        <p className="typo-bold-18 tracking-wide text-white lg:text-2xl">{timeRemaining}</p>
      </div>
    </div>
  );
}
