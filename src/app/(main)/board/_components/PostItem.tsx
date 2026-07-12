import type { PostSummaryResponse } from "@/apis/generated/api";
import Link from "next/link";
import { memo } from "react";

interface PostItemProps {
  post: PostSummaryResponse;
  isMobile: boolean;
  boardId: string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "방금 전";
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffHours < 48) return "어제";
  return date.toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  });
}

// rerender-memo: PostItem은 목록에서 최대 60개까지 렌더링되므로
// 부모 리렌더 시 불필요한 재생성을 막기 위해 React.memo로 감쌈
const PostItem = memo(function PostItem({ post, isMobile, boardId }: PostItemProps) {
  if (isMobile) {
    return (
      <Link
        href={`/board/${boardId}/posts/${post.id}`}
        className="block border-b border-white/10 px-1 py-3 hover:bg-white/5 transition-colors"
        // rendering-content-visibility: 오프스크린 아이템의 layout/paint 생략
        style={{ contentVisibility: "auto", containIntrinsicSize: "0 60px" }}
      >
        <div className="text-sm font-medium text-white line-clamp-1">
          {post.title}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
          <span>#{post.authorId}</span>
          <span>·</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/board/${boardId}/posts/${post.id}`}
      className="grid grid-cols-[1fr_80px_100px] gap-3 items-center border-b border-white/10 px-4 py-3 hover:bg-white/5 transition-colors"
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 44px" }}
    >
      <span className="text-sm font-medium text-white truncate">
        {post.title}
      </span>
      <span className="text-xs text-gray-400 text-right">#{post.authorId}</span>
      <span className="text-xs text-gray-400 text-right">
        {formatDate(post.createdAt)}
      </span>
    </Link>
  );
});

export default PostItem;