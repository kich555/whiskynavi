import { postApiBoardsBoardidPostsPostidViews } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions, getAuthToken } from "@/lib/auth";
import { isAdminUser } from "@/lib/role";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import PostDetailContent from "../../../_components/PostDetailContent";
import { getBoard } from "../../../_lib/board";
import { getCommentPage } from "../../../_lib/comment-page";
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
  const isAdmin = isAdminUser(session?.user?.roles ?? []);

  // async-parallel: 게시글 + 댓글 + 관리자용 분류 목록 병렬 fetch
  const [postRes, commentsRes, board] = await Promise.all([
    postApiBoardsBoardidPostsPostidViews(COMMUNITY_BOARD_ID, id, token ? withToken(token) : undefined).catch(
      () => null,
    ),
    getCommentPage(COMMUNITY_BOARD_ID, id, undefined, token).catch(() => null),
    isAdmin ? getBoard(COMMUNITY_BOARD_ID, token).catch(() => undefined) : Promise.resolve(undefined),
  ]);

  if (!postRes) {
    notFound();
  }

  return (
    <PostDetailContent
      post={postRes.data}
      boardId={COMMUNITY_BOARD_ID}
      currentUserId={currentUserId}
      commentPage={commentsRes ?? { comments: [], nextCursor: null, hasMore: false }}
      isLoggedIn={Boolean(token)}
      isAdmin={isAdmin}
      postTypes={board?.postTypes ?? []}
    />
  );
}
