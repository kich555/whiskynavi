"use client";

import type { CommentResponse, PostResponse } from "@/apis/generated/api";
import { FormMessage } from "@/components/ui/form-message";
import Link from "next/link";
import { useState, useTransition } from "react";
import { deletePostAction } from "../_lib/actions";
import AdminPostDeleteDialog from "./AdminPostDeleteDialog";
import CommentsSection from "./CommentsSection";
import PostDetailShell from "./PostDetailShell";

interface PostDetailContentProps {
  post: PostResponse;
  boardId: string;
  currentUserId?: number;
  comments: CommentResponse[];
  isLoggedIn: boolean;
  isAdmin: boolean;
}

export default function PostDetailContent({
  post,
  boardId,
  currentUserId,
  comments,
  isLoggedIn,
  isAdmin,
}: PostDetailContentProps) {
  const [isDeleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isAuthor = currentUserId !== undefined && post.authorId === currentUserId;

  const handleDelete = () => {
    if (!confirm("게시글을 삭제하시겠습니까?")) return;
    startDelete(async () => {
      const result = await deletePostAction(boardId, post.id!);
      if (result.error) {
        setDeleteError(result.error);
      }
    });
  };

  return (
    <>
      <PostDetailShell
        backHref={`/board/${boardId}`}
        header={
          <>
            <h1 className="mb-2 text-lg leading-snug font-bold text-white">{post.title}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{post.authorNickname ?? "알 수 없는 사용자"}</span>
              <span>·</span>
              <span>{post.createdAt ? new Date(post.createdAt).toLocaleString("ko-KR") : ""}</span>
            </div>
          </>
        }
        content={post.content ?? ""}
        actions={
          isAuthor || (isAdmin && post.boardId !== undefined) ? (
            <>
              {isAuthor && (
                <Link
                  href={`/board/${boardId}/posts/${post.id}/edit`}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/5"
                >
                  수정
                </Link>
              )}
              {isAdmin && post.boardId !== undefined ? (
                <AdminPostDeleteDialog boardId={post.boardId} boardRoute={boardId} postId={post.id!} />
              ) : (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  {isDeleting ? "삭제 중..." : "삭제"}
                </button>
              )}
              {!isAdmin && <FormMessage message={deleteError} variant="error" />}
            </>
          ) : undefined
        }
      />

      <CommentsSection
        boardId={boardId}
        postId={post.id!}
        comments={comments}
        currentUserId={currentUserId}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}
