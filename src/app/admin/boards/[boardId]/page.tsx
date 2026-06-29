import { getApiAdminBoardsAnnouncements, getApiAdminBoardsBoardid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { notFound } from "next/navigation";
import BoardDetailContent from "./_components/BoardDetailContent";

interface BoardDetailPageProps {
  params: Promise<{ boardId: string }>;
}

async function fetchBoardDetail(boardId: string) {
  const token = await getAuthToken();
  const id = Number(boardId);
  const [boardRes, announcementsRes] = await Promise.all([
    getApiAdminBoardsBoardid(id, withToken(token)),
    getApiAdminBoardsAnnouncements({ page: 0, size: 50 }, withToken(token)),
  ]);
  return {
    board: boardRes.data,
    boardAnnouncements: (announcementsRes.data.content ?? []).filter(
      (a) => a.boardId === id || a.scope === "GLOBAL",
    ),
  };
}

export default async function BoardDetailPage({ params }: BoardDetailPageProps) {
  const { boardId } = await params;

  let data;
  try {
    data = await fetchBoardDetail(boardId);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    notFound();
  }

  return <BoardDetailContent board={data.board} announcements={data.boardAnnouncements} />;
}