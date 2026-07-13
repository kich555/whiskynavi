import type { CommentResponse } from "@/apis/generated/api";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";

interface CommentsSectionProps {
  boardId: string;
  postId: number;
  comments: CommentResponse[];
  currentUserId?: number;
  isLoggedIn: boolean;
}

export default function CommentsSection({ boardId, postId, comments, currentUserId, isLoggedIn }: CommentsSectionProps) {
  const totalCount = comments.length + comments.reduce((acc, c) => acc + (c.replies?.length ?? 0), 0);

  return (
    <section className="mx-auto max-w-3xl px-4 py-6">
      <h2 className="mb-4 text-lg font-bold text-white">
        댓글 <span className="text-gray-500">({totalCount})</span>
      </h2>

      {/* 최상위 댓글 작성 폼 (로그인 시만) */}
      {isLoggedIn ? (
        <div className="mb-6">
          <CommentForm boardId={boardId} postId={postId} placeholder="댓글을 입력하세요." />
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-gray-500">
          댓글을 작성하려면 로그인이 필요합니다.
        </div>
      )}

      {/* 댓글 목록 */}
      {comments.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</p>
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
        </div>
      )}
    </section>
  );
}
