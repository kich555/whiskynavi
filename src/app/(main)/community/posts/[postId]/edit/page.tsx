import { getApiBoardsBoardidPostsPostid } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { COMMUNITY_BOARD_ID } from "../../../_lib/constants";
import PostEditContent from "./_components/PostEditContent";

interface PostEditPageProps {
  params: Promise<{ postId: string }>;
}

export default async function PostEditPage({ params }: PostEditPageProps) {
  const { postId } = await params;
  const id = Number(postId);

  // async-parallel: session 먼저 체크 (early redirect)
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/sign-in?callbackUrl=/community/posts/${id}/edit`);
  }

  // async-parallel: token + API fetch 병렬
  // (getApiBoardsBoardidPostsPostid는 public read-only API이므로 token 불필요)
  const apiRes = await getApiBoardsBoardidPostsPostid(
    COMMUNITY_BOARD_ID,
    id,
  ).catch(() => null);

  if (!apiRes) {
    notFound();
  }
  const post = apiRes.data;

  // 본인 글만 수정 가능
  if (post.authorId !== Number(session.user.id)) {
    redirect(`/community/posts/${id}`);
  }

  return <PostEditContent post={post} />;
}