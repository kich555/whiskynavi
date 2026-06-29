import type { UserAnnouncementSummaryResponse } from "@/apis/generated/api";
import Link from "next/link";

interface AnnouncementItemProps {
  announcement: UserAnnouncementSummaryResponse;
  isMobile: boolean;
}

// rendering-content-visibility: 공지도 목록 아이템이므로 content-visibility 적용
export default function AnnouncementItem({
  announcement,
  isMobile,
}: AnnouncementItemProps) {
  if (isMobile) {
    return (
      <Link
        href={`/community/announcements/${announcement.id}`}
        className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-lg px-3 py-2.5 hover:bg-amber-500/20 transition-colors"
        style={{ contentVisibility: "auto", containIntrinsicSize: "0 44px" }}
      >
        <span className="shrink-0 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          공지
        </span>
        <span className="text-sm text-white truncate">
          {announcement.title}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/community/announcements/${announcement.id}`}
      className="grid grid-cols-[1fr_80px_100px] gap-3 items-center bg-amber-500/15 border-b border-amber-500/30 px-4 py-3 hover:bg-amber-500/20 transition-colors"
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 40px" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          공지
        </span>
        <span className="text-sm font-medium text-white truncate">
          {announcement.title}
        </span>
      </div>
      <span className="text-xs text-gray-400 text-right">관리자</span>
      <span className="text-xs text-gray-400 text-right">
        {announcement.createdAt
          ? new Date(announcement.createdAt).toLocaleDateString("ko-KR")
          : ""}
      </span>
    </Link>
  );
}