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
  const authorNickname = post.authorNickname ?? "알 수 없는 사용자";

  if (isMobile) {
    return (
      <Link
        href={`/board/${boardId}/posts/${post.id}`}
        className="block border-b border-white/10 px-1 py-3 transition-colors hover:bg-white/5"
        // rendering-content-visibility: 오프스크린 아이템의 layout/paint 생략
        style={{ contentVisibility: "auto", containIntrinsicSize: "0 60px" }}
      >
        <div className="line-clamp-1 text-sm font-medium text-white">
          {post.title}
          {(post.commentCount ?? 0) > 0 ? <span className="ml-1 text-amber-500">[{post.commentCount}]</span> : null}
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
          <span>{authorNickname}</span>
          <span>·</span>
          <span>조회 {post.viewCount ?? 0}</span>
          <span>·</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/board/${boardId}/posts/${post.id}`}
      className="grid grid-cols-[1fr_100px_64px_100px] items-center gap-3 border-b border-white/10 px-4 py-3 transition-colors hover:bg-white/5"
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 44px" }}
    >
      <span className="truncate text-sm font-medium text-white">
        {post.title}
        {(post.commentCount ?? 0) > 0 ? <span className="ml-1 text-amber-500">[{post.commentCount}]</span> : null}
      </span>
      <span className="text-right text-xs text-gray-400">{authorNickname}</span>
      <span className="text-right text-xs text-gray-400">{post.viewCount ?? 0}</span>
      <span className="text-right text-xs text-gray-400">{formatDate(post.createdAt)}</span>
    </Link>
  );
});

export default PostItem;
