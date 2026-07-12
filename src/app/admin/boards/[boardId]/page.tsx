import {
  getApiAdminBoardsAnnouncements,
  getApiAdminBoardsBoardid,
  getApiAdminBoardsBoardidPostTypes,
} from "@/apis/generated/api";
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

  // postTypes 조회 실패가 존재하는 게시판을 404로 가리지 않도록 별도로 처리
  let postTypes: Awaited<ReturnType<typeof getApiAdminBoardsBoardidPostTypes>>["data"] = [];
  try {
    postTypes = (await getApiAdminBoardsBoardidPostTypes(id, withToken(token))).data ?? [];
  } catch (error) {
    console.error(`게시판 ${id}의 게시글타입 조회에 실패했습니다.`, error);
  }

  return {
    board: boardRes.data,
    boardAnnouncements: (announcementsRes.data.content ?? []).filter((a) => a.boardId === id || a.scope === "GLOBAL"),
    postTypes,
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

  return <BoardDetailContent board={data.board} announcements={data.boardAnnouncements} postTypes={data.postTypes} />;
}
