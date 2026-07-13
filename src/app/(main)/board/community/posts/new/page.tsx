import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PostCreateContent from "../../../_components/PostCreateContent";
import { getBoard } from "../../../_lib/board";
import { COMMUNITY_BOARD_ID } from "../../../_lib/constants";

export default async function PostNewPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/sign-in?callbackUrl=/board/community/posts/new");
  }

  const board = await getBoard(COMMUNITY_BOARD_ID, session.accessToken);

  return <PostCreateContent boardId={COMMUNITY_BOARD_ID} postTypes={board?.postTypes ?? []} />;
}
