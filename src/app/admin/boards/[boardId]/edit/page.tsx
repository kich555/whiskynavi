import { getApiAdminBoardsBoardid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { notFound } from "next/navigation";
import BoardEditContent from "./_components/BoardEditContent";

interface BoardEditPageProps {
  params: Promise<{ boardId: string }>;
}

async function fetchBoard(boardId: string) {
  const token = await getAuthToken();
  const res = await getApiAdminBoardsBoardid(Number(boardId), withToken(token));
  return res.data;
}

export default async function BoardEditPage({ params }: BoardEditPageProps) {
  const { boardId } = await params;

  let board;
  try {
    board = await fetchBoard(boardId);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    notFound();
  }

  return <BoardEditContent board={board} />;
}