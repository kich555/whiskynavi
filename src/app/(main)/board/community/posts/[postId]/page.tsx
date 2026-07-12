import { getApiBoardsBoardidPostsPostid, getApiBoardsBoardidPostsPostidComments } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions, getAuthToken } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import PostDetailContent from "../../../_components/PostDetailContent";
import { COMMUNITY_BOARD_ID } from "../../../_lib/constants";

interface PostDetailPageProps {
  params: Promise<{ postId: string }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params;
  const id = Number(postId);

  // async-parallel: session + token 병렬 fetch
  const [session, token] = await Promise.all([getServerSession(authOptions), getAuthToken()]);

  const currentUserId = session?.user?.id ? Number(session.user.id) : undefined;

  // async-parallel: 게시글 + 댓글 병렬 fetch
  const [postRes, commentsRes] = await Promise.all([
    getApiBoardsBoardidPostsPostid(COMMUNITY_BOARD_ID, id, token ? withToken(token) : undefined).catch(() => null),
    getApiBoardsBoardidPostsPostidComments(COMMUNITY_BOARD_ID, id, token ? withToken(token) : undefined).catch(
      () => null,
    ),
  ]);

  if (!postRes) {
    notFound();
  }

  return (
    <PostDetailContent
      post={postRes.data}
      boardId={COMMUNITY_BOARD_ID}
      currentUserId={currentUserId}
      comments={commentsRes?.data ?? []}
      isLoggedIn={Boolean(token)}
    />
  );
}
