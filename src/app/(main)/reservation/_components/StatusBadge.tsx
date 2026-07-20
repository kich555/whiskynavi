import { cn } from "@/lib/utils";
import type { NoticeStatus } from "../_lib/utils";
import { getStatusBadge } from "../_lib/utils";

interface StatusBadgeProps {
  status: NoticeStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const badge = getStatusBadge(status);
  return (
    <div className={cn("typo-bold-12 px-2 py-1 text-white lg:px-4 lg:py-2 lg:typo-bold-14", badge.className, className)}>
      {badge.label}
    </div>
  );
}
