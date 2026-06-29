import { getApiAdminBoardsAnnouncements, getApiAdminBoardsBoardid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { notFound } from "next/navigation";
import BoardDetailContent from "./_components/BoardDetailContent";

interface BoardDetailPageProps {
  params: Promise<{ boardId: string }>;
}

export default async function BoardDetailPage({ params }: BoardDetailPageProps) {
  const { boardId } = await params;
  const token = await getAuthToken();
  const id = Number(boardId);

  try {
    const [boardRes, announcementsRes] = await Promise.all([
      getApiAdminBoardsBoardid(id, withToken(token)),
      getApiAdminBoardsAnnouncements({ page: 0, size: 50 }, withToken(token)),
    ]);

    const boardAnnouncements = (announcementsRes.data.content ?? []).filter(
      (a) => a.boardId === id || a.scope === "GLOBAL",
    );

    return <BoardDetailContent board={boardRes.data} announcements={boardAnnouncements} />;
  } catch {
    notFound();
  }
}