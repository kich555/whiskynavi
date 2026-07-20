"use client";

import type { UserAnnouncementResponse } from "@/apis/generated/api";
import PostDetailShell from "./PostDetailShell";

interface AnnouncementDetailContentProps {
  announcement: UserAnnouncementResponse;
  boardId: string;
  currentUserId?: number;
}

export default function AnnouncementDetailContent({ announcement, boardId }: AnnouncementDetailContentProps) {
  return (
    <PostDetailShell
      backHref={`/board/${boardId}`}
      header={
        <>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white">공지</span>
            <h1 className="text-lg leading-snug font-bold text-white">{announcement.title}</h1>
          </div>
          <div className="typo-medium-12 flex items-center gap-2 text-gray-500">
            <span>관리자</span>
            <span>·</span>
            <span>{announcement.createdAt ? new Date(announcement.createdAt).toLocaleString("ko-KR") : ""}</span>
          </div>
        </>
      }
      content={announcement.content ?? ""}
    />
  );
}
