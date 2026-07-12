import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PostCreateContent from "../../../_components/PostCreateContent";
import { NEWS_BOARD_ID } from "../../../_lib/constants";

export default async function PostNewPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/sign-in?callbackUrl=/board/news/posts/new");
  }
  return <PostCreateContent boardId={NEWS_BOARD_ID} />;
}
