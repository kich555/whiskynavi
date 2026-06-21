import type { PostSummaryResponse } from "@/apis/generated/api";
import PostItem from "./PostItem";

interface PostCardListProps {
  posts: PostSummaryResponse[];
}

export default function PostCardList({ posts }: PostCardListProps) {
  return (
    <div className="divide-y divide-white/10">
      {posts.map((post) => (
        <PostItem key={post.id} post={post} isMobile />
      ))}
    </div>
  );
}