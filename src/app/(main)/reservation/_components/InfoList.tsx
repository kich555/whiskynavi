import type { BottleReservationNoticePublicResponse } from "@/apis/generated/api";
import { buildInfoItems, formatDateTime, formatReservationRole } from "../_lib/utils";

interface InfoListProps {
  notice: BottleReservationNoticePublicResponse;
}

export default function InfoList({ notice }: InfoListProps) {
  const infoItems = buildInfoItems(notice);

  return (
    <div className="space-y-2 lg:space-y-3">
      {infoItems.map((item) => (
        <div key={item.label} className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-sm text-gray-400 lg:text-base">{item.label}</span>
          <span className="typo-medium-14 text-white lg:text-base">{item.value}</span>
        </div>
      ))}
      {notice.gradeConditions && notice.gradeConditions.length > 0 && (
        <div className="border-b border-white/10 pb-2">
          <span className="text-sm text-gray-400 lg:text-base">예약 조건</span>
          <div className="mt-1 space-y-1">
            {notice.gradeConditions.map((cond, i) => (
              <div key={i} className="text-xs text-gray-300 lg:text-sm">
                {formatReservationRole(cond.requiredRole)} -{" "}
                {cond.applicableFrom ? formatDateTime(cond.applicableFrom) : "즉시"}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
