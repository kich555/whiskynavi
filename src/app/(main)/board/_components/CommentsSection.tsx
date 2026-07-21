"use client";

import type { CommentResponse } from "@/apis/generated/api";
import { useState, useTransition } from "react";
import { loadMoreCommentsAction } from "../_lib/actions";
import type { CommentPageData } from "../_lib/comment-page";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";

interface CommentsSectionProps {
  boardId: string;
  postId: number;
  initialPage: CommentPageData;
  totalCount?: number;
  currentUserId?: number;
  isLoggedIn: boolean;
}

export default function CommentsSection({
  boardId,
  postId,
  initialPage,
  totalCount,
  currentUserId,
  isLoggedIn,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentResponse[]>(initialPage.comments);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingMore, startLoadingMore] = useTransition();
  const loadedCount = comments.length + comments.reduce((acc, c) => acc + (c.replies?.length ?? 0), 0);

  const handleLoadMore = () => {
    if (!hasMore || !nextCursor) return;
    setLoadError(null);
    startLoadingMore(async () => {
      const result = await loadMoreCommentsAction(boardId, postId, nextCursor);
      if (!result.success) {
        setLoadError(result.error);
        return;
      }
      setComments((current) => {
        const existingIds = new Set(current.map((comment) => comment.id));
        return [...current, ...result.page.comments.filter((comment) => !existingIds.has(comment.id))];
      });
      setNextCursor(result.page.nextCursor);
      setHasMore(result.page.hasMore);
    });
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-6">
      <h2 className="mb-4 text-lg font-bold text-white">
        댓글{" "}
        <span className="text-gray-500">
          ({totalCount ?? loadedCount}
          {totalCount === undefined && hasMore ? "+" : ""})
        </span>
      </h2>

      {/* 최상위 댓글 작성 폼 (로그인 시만) */}
      {isLoggedIn ? (
        <div className="mb-6">
          <CommentForm boardId={boardId} postId={postId} placeholder="댓글을 입력하세요." />
        </div>
      ) : (
        <div className="typo-medium-14 mb-6 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-gray-500">
          댓글을 작성하려면 로그인이 필요합니다.
        </div>
      )}

      {/* 댓글 목록 */}
      {comments.length === 0 ? (
        <p className="typo-medium-14 py-8 text-center text-gray-500">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              boardId={boardId}
              postId={postId}
              currentUserId={currentUserId}
            />
          ))}
          {hasMore && nextCursor ? (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="typo-medium-14 w-full rounded-lg border border-white/10 py-3 text-gray-300 transition-colors hover:bg-white/5 disabled:opacity-50"
            >
              {isLoadingMore ? "댓글 불러오는 중..." : "댓글 더 보기"}
            </button>
          ) : null}
          {loadError ? <p className="typo-medium-12 text-center text-red-400">{loadError}</p> : null}
        </div>
      )}
    </section>
  );
}
