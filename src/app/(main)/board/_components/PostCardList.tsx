import type { PostSummaryResponse } from "@/apis/generated/api";
import PostItem from "./PostItem";

interface PostCardListProps {
  posts: PostSummaryResponse[];
  boardId: string;
}

export default function PostCardList({ posts, boardId }: PostCardListProps) {
  return (
    <div className="divide-y divide-white/10">
      {posts.map((post) => (
        <PostItem key={post.id} post={post} isMobile boardId={boardId} />
      ))}
    </div>
  );
}