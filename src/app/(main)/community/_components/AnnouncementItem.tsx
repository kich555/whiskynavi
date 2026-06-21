import type { UserAnnouncementSummaryResponse } from "@/apis/generated/api";

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
      <div
        className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5"
        style={{ contentVisibility: "auto", containIntrinsicSize: "0 44px" }}
      >
        <span className="shrink-0 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          공지
        </span>
        <span className="text-sm text-gray-800 truncate">
          {announcement.title}
        </span>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-[1fr_80px_100px] gap-3 items-center bg-amber-50 border-b border-amber-200 px-4 py-3"
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 40px" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0 bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          공지
        </span>
        <span className="text-sm font-medium text-gray-800 truncate">
          {announcement.title}
        </span>
      </div>
      <span className="text-xs text-gray-500 text-right">관리자</span>
      <span className="text-xs text-gray-500 text-right">
        {announcement.createdAt
          ? new Date(announcement.createdAt).toLocaleDateString("ko-KR")
          : ""}
      </span>
    </div>
  );
}