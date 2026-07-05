import { getApiBoardsBoardidPostsPostid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions } from "@/lib/auth";
import { getAuthToken } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { COMMUNITY_BOARD_ID } from "../../_lib/constants";
import PostDetailContent from "./_components/PostDetailContent";

interface PostDetailPageProps {
  params: Promise<{ postId: string }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params;
  const id = Number(postId);

  // async-parallel: session + token 병렬 fetch
  const [session, token] = await Promise.all([
    getServerSession(authOptions),
    getAuthToken(),
  ]);

  const currentUserId = session?.user?.id ? Number(session.user.id) : undefined;

  const res = await getApiBoardsBoardidPostsPostid(
    COMMUNITY_BOARD_ID,
    id,
    token ? withToken(token) : undefined,
  ).catch(() => null);

  if (!res) {
    notFound();
  }

  return <PostDetailContent post={res.data} currentUserId={currentUserId} />;
}