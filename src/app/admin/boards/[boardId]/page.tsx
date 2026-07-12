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

  // 게시판 본문은 단독 fetch — 공지/글타입 조회가 실패해도 게시판 정보는 보여야 한다.
  const boardRes = await getApiAdminBoardsBoardid(id, withToken(token));

  // 공지 목록은 boardId로 서버 필터링해 가져온다. 전체 목록을 가져와 클라이언트에서
  // 필터링하던 기존 방식은 특정 공지의 postType이 null일 때 백엔드가 NPE(500)를 반환하는
  // 버그에 노출되어, board fetch까지 함께 실패하며 notFound()로 빠지는 원인이 되었다.
  // boardId 좁히기로 회피 + Promise.allSettled로 한쪽이 실패해도 살림.
  const scopedResult = await getApiAdminBoardsAnnouncements(
    { page: 0, size: 50, boardId: id },
    withToken(token),
  ).catch((error: unknown) => {
    if (isRedirectError(error)) throw error;
    console.error(`게시판 ${id}의 BOARD 공지 조회에 실패했습니다.`, error);
    return null;
  });
  const globalResult = await getApiAdminBoardsAnnouncements(
    { page: 0, size: 50, scope: "GLOBAL" },
    withToken(token),
  ).catch((error: unknown) => {
    if (isRedirectError(error)) throw error;
    console.error(`게시판 ${id}의 GLOBAL 공지 조회에 실패했습니다.`, error);
    return null;
  });
  const scoped = scopedResult?.data.content ?? [];
  const global = globalResult?.data.content ?? [];
  // 중복(GLOBAL 공지가 boardId 필터에도 잡히는 경우)을 제거하며 합친다.
  const seen = new Set(scoped.map((a) => a.id));
  const boardAnnouncements = [...scoped, ...global.filter((a) => !seen.has(a.id))];

  // postTypes 조회 실패가 존재하는 게시판을 404로 가리지 않도록 별도로 처리
  let postTypes: Awaited<ReturnType<typeof getApiAdminBoardsBoardidPostTypes>>["data"] = [];
  try {
    postTypes = (await getApiAdminBoardsBoardidPostTypes(id, withToken(token))).data ?? [];
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(`게시판 ${id}의 게시글타입 조회에 실패했습니다.`, error);
  }

  return {
    board: boardRes.data,
    boardAnnouncements,
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
