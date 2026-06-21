"use client";

import type { PostResponse } from "@/apis/generated/api";
import { FormMessage } from "@/components/ui/form-message";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { deletePostAction } from "../../../actions";
import Link from "next/link";
import dynamic from "next/dynamic";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

// bundle-dynamic-imports: react-markdown은 약 100KB+ 번들.
// PostDetailContent에서만 사용되므로 next/dynamic으로 lazy-load (ssr: false).
// (remark-gfm, rehype-sanitize 플러그인은 가벼워서 정적 import)
const ReactMarkdown = dynamic(
  () => import("react-markdown").then((m) => m.default),
  { ssr: false },
);

interface PostDetailContentProps {
  post: PostResponse;
  currentUserId?: number;
}

export default function PostDetailContent({
  post,
  currentUserId,
}: PostDetailContentProps) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isAuthor =
    currentUserId !== undefined && post.authorId === currentUserId;

  const handleDelete = () => {
    if (!confirm("게시글을 삭제하시겠습니까?")) return;
    startDelete(async () => {
      const result = await deletePostAction(post.id!);
      if (result.error) {
        setDeleteError(result.error);
      }
    });
  };

  return (
    <div className="mx-auto mt-20 min-h-screen max-w-[1440px] bg-[#1d2429]">
      <div className="mx-auto max-w-3xl px-4 py-6">
      {/* 뒤로가기 */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4"
      >
        ← 목록으로
      </Link>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
        {/* 헤더 */}
        <div className="px-5 pt-5 pb-3 border-b border-white/10">
          <h1 className="text-lg font-bold text-white leading-snug mb-2">
            {post.title}
          </h1>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>#{post.authorId}</span>
            <span>·</span>
            <span>
              {post.createdAt
                ? new Date(post.createdAt).toLocaleString("ko-KR")
                : ""}
            </span>
          </div>
        </div>

        {/* 본문 (react-markdown) — lazy-loaded */}
        <div className="px-5 py-5 prose prose-sm max-w-none prose-img:rounded-lg prose-img:my-4 [&_*]:text-white [&_img]:text-transparent">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
          >
            {post.content ?? ""}
          </ReactMarkdown>
        </div>

        {/* 액션 */}
        {isAuthor && (
          <div className="px-5 pb-5 flex items-center gap-3 border-t border-white/10 pt-4">
            <Link
              href={`/community/posts/${post.id}/edit`}
              className="text-sm text-gray-400 border border-white/20 rounded-lg px-3 py-1.5 hover:bg-white/5 transition-colors"
            >
              수정
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-sm text-red-600 border border-red-300 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </button>
            <FormMessage message={deleteError} variant="error" />
          </div>
        )}
      </div>
    </div>
    </div>
  );
}