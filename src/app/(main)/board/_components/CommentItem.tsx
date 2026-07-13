"use client";

import type { CommentReplyResponse, CommentResponse } from "@/apis/generated/api";
import { FormMessage } from "@/components/ui/form-message";
import { useState, useTransition } from "react";
import { deleteCommentAction } from "../_lib/actions";
import CommentForm from "./CommentForm";

type CommentLike = CommentResponse | CommentReplyResponse;

interface CommentItemProps {
  comment: CommentResponse;
  boardId: string;
  postId: number;
  currentUserId?: number;
  /** 최상위 댓글인지. false면 reply. */
  isTopLevel?: boolean;
}

function isAuthor(c: CommentLike, userId?: number): boolean {
  return userId !== undefined && c.authorId === userId;
}

function formatDate(s?: string): string {
  if (!s) return "";
  return new Date(s).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CommentItem({ comment, boardId, postId, currentUserId, isTopLevel = true }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canEdit = isAuthor(comment, currentUserId);

  const handleDelete = () => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteCommentAction(boardId, postId, comment.id!);
      if (result.error) setDeleteError(result.error);
    });
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
        {isEditing ? (
          <CommentForm
            boardId={boardId}
            postId={postId}
            commentId={comment.id}
            initialContent={comment.content}
            onCancel={() => setIsEditing(false)}
            compact
          />
        ) : (
          <>
            <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
              <span className="text-gray-300">{comment.authorNickname ?? "알 수 없는 사용자"}</span>
              <span>·</span>
              <span>{formatDate(comment.createdAt)}</span>
              {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                <span className="text-gray-600">(수정됨)</span>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap text-white">{comment.content}</p>

            <div className="mt-2 flex items-center gap-3 text-xs">
              {canEdit && !isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-gray-400 transition-colors hover:text-amber-500"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-500 transition-colors hover:text-red-400 disabled:opacity-50"
                  >
                    {isDeleting ? "삭제 중..." : "삭제"}
                  </button>
                </>
              )}
              {isTopLevel && !isReplying && (
                <button
                  type="button"
                  onClick={() => setIsReplying(true)}
                  className="text-gray-400 transition-colors hover:text-amber-500"
                >
                  답글
                </button>
              )}
            </div>
            {deleteError && <FormMessage message={deleteError} variant="error" />}
          </>
        )}
      </div>

      {/* 대댓글 작성 폼 */}
      {isReplying && (
        <div className="ml-4">
          <CommentForm
            boardId={boardId}
            postId={postId}
            parentCommentId={comment.id}
            onCancel={() => setIsReplying(false)}
            placeholder="답글을 입력하세요."
            compact
          />
        </div>
      )}

      {/* 대댓글 목록 */}
      {isTopLevel && comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={{ ...reply, replies: undefined }}
              boardId={boardId}
              postId={postId}
              currentUserId={currentUserId}
              isTopLevel={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
