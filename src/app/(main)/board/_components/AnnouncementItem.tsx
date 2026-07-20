import type { UserAnnouncementSummaryResponse } from "@/apis/generated/api";
import Link from "next/link";

interface AnnouncementItemProps {
  announcement: UserAnnouncementSummaryResponse;
  isMobile: boolean;
  boardId: string;
}

// rendering-content-visibility: 공지도 목록 아이템이므로 content-visibility 적용
export default function AnnouncementItem({ announcement, isMobile, boardId }: AnnouncementItemProps) {
  if (isMobile) {
    return (
      <Link
        href={`/board/${boardId}/announcements/${announcement.id}`}
        className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/15 px-3 py-2.5 transition-colors hover:bg-amber-500/20"
        style={{ contentVisibility: "auto", containIntrinsicSize: "0 44px" }}
      >
        <span className="shrink-0 rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white">공지</span>
        <span className="typo-medium-14 truncate text-white">{announcement.title}</span>
      </Link>
    );
  }

  return (
    <Link
      href={`/board/${boardId}/announcements/${announcement.id}`}
      className="grid grid-cols-[1fr_80px_100px] items-center gap-3 border-b border-amber-500/30 bg-amber-500/15 px-4 py-3 transition-colors hover:bg-amber-500/20"
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 40px" }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white">공지</span>
        <span className="typo-medium-14 truncate text-white">{announcement.title}</span>
      </div>
      <span className="typo-medium-12 text-right text-gray-400">관리자</span>
      <span className="typo-medium-12 text-right text-gray-400">
        {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString("ko-KR") : ""}
      </span>
    </Link>
  );
}
