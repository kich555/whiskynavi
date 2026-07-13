import { getApiBoardsBoardidPostsPostid } from "@/apis/generated/api";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import PostEditContent from "../../../../_components/PostEditContent";
import { getBoard } from "../../../../_lib/board";
import { NEWS_BOARD_ID } from "../../../../_lib/constants";

interface PostEditPageProps {
  params: Promise<{ postId: string }>;
}

export default async function PostEditPage({ params }: PostEditPageProps) {
  const { postId } = await params;
  const id = Number(postId);

  // async-parallel: session 체크
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/sign-in?callbackUrl=/board/news/posts/${id}/edit`);
  }

  // 게시글과 게시판 타입은 서로 독립적이므로 병렬 조회
  const [apiRes, board] = await Promise.all([
    getApiBoardsBoardidPostsPostid(NEWS_BOARD_ID, id).catch(() => null),
    getBoard(NEWS_BOARD_ID, session.accessToken),
  ]);

  if (!apiRes) {
    notFound();
  }
  const post = apiRes.data;

  // 본인 글만 수정 가능
  if (post.authorId !== Number(session.user.id)) {
    redirect(`/board/news/posts/${id}`);
  }

  return <PostEditContent post={post} boardId={NEWS_BOARD_ID} postTypes={board?.postTypes ?? []} />;
}
