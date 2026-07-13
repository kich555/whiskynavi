import { getApiAdminBoardsBoardid, getApiAdminBoardsBoardidPostTypes } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { notFound } from "next/navigation";
import { getAnnouncementDetailAction } from "../../../../actions";
import AnnouncementEditContent from "./_components/AnnouncementEditContent";

interface AnnouncementEditPageProps {
  params: Promise<{ boardId: string; announcementId: string }>;
}

export default async function AnnouncementEditPage({ params }: AnnouncementEditPageProps) {
  const { boardId, announcementId } = await params;
  const id = Number(boardId);
  const annId = Number(announcementId);
  const token = await getAuthToken();

  let board;
  let postTypes: Awaited<ReturnType<typeof getApiAdminBoardsBoardidPostTypes>>["data"] = [];
  try {
    [board, postTypes] = await Promise.all([
      getApiAdminBoardsBoardid(id, withToken(token)).then((res) => res.data),
      getApiAdminBoardsBoardidPostTypes(id, {}, withToken(token))
        .then((res) => res.data ?? [])
        .catch(() => []),
    ]);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    notFound();
  }

  // 공지 상세는 서버 액션으로 조회 (토큰 처리 캡슐화)
  const detailResult = await getAnnouncementDetailAction(annId);
  if (!detailResult.success) {
    notFound();
  }

  return (
    <AnnouncementEditContent
      boardId={id}
      boardName={board.name ?? "게시판"}
      postTypes={postTypes}
      announcement={detailResult.data}
    />
  );
}
