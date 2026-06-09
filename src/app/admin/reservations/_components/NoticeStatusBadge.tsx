import { Badge } from "@/components/ui/badge";
import {
  getReservationNoticeStatus,
  getReservationNoticeStatusClassName,
  getReservationNoticeStatusLabel,
} from "../_lib/noticeStatus";

interface NoticeStatusBadgeProps {
  notice: Parameters<typeof getReservationNoticeStatus>[0];
}

export default function NoticeStatusBadge({ notice }: NoticeStatusBadgeProps) {
  const status = getReservationNoticeStatus(notice);

  return (
    <Badge className={getReservationNoticeStatusClassName(status)}>{getReservationNoticeStatusLabel(status)}</Badge>
  );
}
