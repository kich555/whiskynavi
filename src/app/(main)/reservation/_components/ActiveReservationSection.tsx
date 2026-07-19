import type { UserBottleReservationNoticePublicResponse } from "@/apis/generated/api";
import Link from "next/link";
import ReservationCard from "./ReservationCard";

interface ActiveReservationSectionProps {
  notices: UserBottleReservationNoticePublicResponse[];
}

export default function ActiveReservationSection({ notices }: ActiveReservationSectionProps) {
  return (
    <div className="mb-10 lg:border lg:border-white/10 lg:px-8 lg:pt-6 lg:pb-8">
      <h2 className="typo-bold-20 mb-4 text-white lg:text-2xl">현재 진행 중인 예약</h2>
      {notices.length === 0 ? (
        <div className="typo-medium-14 border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-gray-400">
          현재 진행 중인 예약 공고가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-5">
          {notices.map((notice) => (
            <Link key={notice.id} href={`/reservation/${notice.id}`}>
              <ReservationCard notice={notice} status="active" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
