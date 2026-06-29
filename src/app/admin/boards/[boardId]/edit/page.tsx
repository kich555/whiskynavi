import { getApiAdminBoardsBoardid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { notFound } from "next/navigation";
import BoardEditContent from "./_components/BoardEditContent";

interface BoardEditPageProps {
  params: Promise<{ boardId: string }>;
}

export default async function BoardEditPage({ params }: BoardEditPageProps) {
  const { boardId } = await params;
  const token = await getAuthToken();

  try {
    const res = await getApiAdminBoardsBoardid(Number(boardId), withToken(token));
    return <BoardEditContent board={res.data} />;
  } catch {
    notFound();
  }
}