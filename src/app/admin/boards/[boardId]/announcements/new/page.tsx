import { getApiAdminBoardsBoardid, getApiAdminBoardsBoardidPostTypes } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { notFound } from "next/navigation";
import AnnouncementCreateContent from "./_components/AnnouncementCreateContent";

interface AnnouncementNewPageProps {
  params: Promise<{ boardId: string }>;
}

export default async function AnnouncementNewPage({ params }: AnnouncementNewPageProps) {
  const { boardId } = await params;
  const id = Number(boardId);
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

  return <AnnouncementCreateContent boardId={id} boardName={board.name ?? "게시판"} postTypes={postTypes} />;
}
