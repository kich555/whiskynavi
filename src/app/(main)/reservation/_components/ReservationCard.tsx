import type { UserBottleReservationNoticePublicResponse } from "@/apis/generated/api";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { formatCurrency } from "@/lib/formatters";

type ReservationStatus = "active" | "ended";

interface ReservationCardProps {
  notice: UserBottleReservationNoticePublicResponse;
  status: ReservationStatus;
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "-";
  return dateStr.slice(0, 16).replace("T", " ");
};

export default function ReservationCard({ notice, status }: ReservationCardProps) {
  const isActive = status === "active";

  return (
    <div className="group cursor-pointer border border-white/10 p-2.5 pb-1.5 text-left transition-colors hover:bg-white/5 sm:p-4 sm:pb-2">
      {/* Image - Square */}
      <div className="relative mb-2 flex aspect-square items-center justify-center">
        <ImageWithFallback
          src={notice.bottleImgUrl}
          alt={notice.bottleName ?? ""}
          fill
          className="object-contain p-1.5 sm:p-4"
        />
      </div>
      {/* Content */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <p className="typo-medium-12 text-gray-400">{notice.bottleBrand ?? "-"}</p>
            <h3
              className="typo-medium-14 mt-2 min-h-[2.8em] text-white group-hover:text-gray-300"
              style={{ lineHeight: 1.4 }}
            >
              <span className="line-clamp-2 block">{notice.noticeName ?? "-"}</span>
              <p className="typo-medium-12 mt-1 line-clamp-2 text-gray-400">{notice.bottleName ?? "-"}</p>
            </h3>
          </div>
          <Badge className={`shrink-0 border-transparent text-white ${isActive ? "bg-blue-600" : "bg-gray-600"}`}>
            {isActive ? "진행 중" : "종료"}
          </Badge>
        </div>
        <div className="mt-2 flex items-center justify-between">
          {notice.price != null && <span className="typo-medium-12 text-gray-400">{formatCurrency(notice.price)}</span>}
          {isActive && notice.availableQuantity != null && (
            <span className="typo-medium-12 text-gray-500">{notice.availableQuantity?.toLocaleString() ?? "-"}병</span>
          )}
        </div>
        {/* Reservation Date */}
        <div className={`typo-medium-12 mt-2 ${isActive ? "text-blue-400" : "text-gray-500"}`}>
          {isActive ? `마감: ${formatDate(notice.reservationEndAt)}` : `종료: ${formatDate(notice.reservationEndAt)}`}
        </div>
      </div>
    </div>
  );
}
