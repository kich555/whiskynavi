import { ApiError } from "@/apis/errors";
import { getApiV2AdminBoardsPostHistoryPostid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { sanitizeRichTextContent } from "@/lib/rich-text";
import Link from "next/link";
import { notFound } from "next/navigation";
import HistoryFrame from "../_components/HistoryFrame";
import { HistoryPerson, HistoryStatus, historyLinkClass } from "../_components/HistoryRecord";
import { formatHistoryDate, historyHref, historyReturnFilters } from "../_lib/history";

interface Props {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}

export default async function BoardHistoryDetailPage({ params, searchParams }: Props) {
  const [{ postId }, query] = await Promise.all([params, searchParams]);
  const id = Number(postId);
  if (!/^\d+$/.test(postId) || !Number.isSafeInteger(id) || id <= 0) notFound();
  const filters = historyReturnFilters(typeof query.returnTo === "string" ? query.returnTo : undefined);
  const token = await getAuthToken();
  let response;
  try {
    response = await getApiV2AdminBoardsPostHistoryPostid(id, withToken(token));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const { post, content } = response.data;
  const sanitizedContent = sanitizeRichTextContent(content);
  return (
    <HistoryFrame title="게시글 관리기록 상세">
      <div className="mx-auto max-w-5xl space-y-5">
        <Link href={historyHref(filters)} className={`typo-medium-14 inline-block ${historyLinkClass}`}>
          ← 조회하던 목록으로
        </Link>
        <article className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <header className="space-y-4 border-b border-gray-200 p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <HistoryStatus post={post} />
              <span className="typo-regular-12 text-gray-500">
                {post.boardName ?? "게시판 정보 없음"} · 게시글 #{post.postId}
              </span>
            </div>
            <h1 className="typo-bold-24 leading-snug break-words text-gray-900">{post.title || "제목 없음"}</h1>
            <div className="typo-regular-14 grid gap-4 text-gray-700 md:grid-cols-3">
              <div>
                <p className="typo-medium-12 mb-2 text-gray-500">작성자</p>
                <HistoryPerson post={post} kind="author" />
              </div>
              <div>
                <p className="typo-medium-12 mb-2 text-gray-500">작성 일시</p>
                <p>{formatHistoryDate(post.createdAt)}</p>
              </div>
              <div>
                <p className="typo-medium-12 mb-2 text-gray-500">최종 수정 일시</p>
                <p>{formatHistoryDate(post.updatedAt)}</p>
              </div>
            </div>
          </header>
          <section aria-label="게시글 본문" className="p-5 md:p-6">
            {sanitizedContent.trim() ? (
              <div
                className="post-rich-text typo-regular-16 min-h-40 leading-relaxed break-words text-gray-900 [&_a]:text-amber-700 [&_a]:underline [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_p]:min-h-[1.5em] [&_pre]:overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />
            ) : (
              <p className="typo-regular-14 py-8 text-gray-500">보존된 본문이 없습니다.</p>
            )}
          </section>
          {post.deleted && (
            <section aria-label="삭제 정보" className="border-t border-gray-200 bg-gray-50 p-5 md:p-6">
              <h2 className="typo-bold-16 mb-4 text-gray-900">삭제 정보</h2>
              <div className="typo-regular-14 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="typo-medium-12 mb-2 text-gray-500">삭제자</p>
                  <HistoryPerson post={post} kind="admin" />
                </div>
                <div>
                  <p className="typo-medium-12 mb-2 text-gray-500">삭제 일시</p>
                  <p>{formatHistoryDate(post.deletedAt)}</p>
                </div>
              </div>
              <div className="mt-5">
                <p className="typo-medium-12 mb-2 text-gray-500">삭제 사유</p>
                <p className="typo-regular-14 leading-relaxed break-words whitespace-pre-wrap text-gray-800">
                  {post.deleteReason ||
                    (post.deletedByRole === "USER"
                      ? "작성자가 직접 삭제한 게시글입니다."
                      : "기록된 삭제 사유가 없습니다.")}
                </p>
              </div>
            </section>
          )}
        </article>
        <div className="typo-regular-14 flex flex-wrap gap-4">
          <Link href={historyHref({ mode: "posts", authorId: String(post.authorId) })} className={historyLinkClass}>
            작성자의 전체 게시글
          </Link>
          <Link href={historyHref({ authorId: String(post.authorId) })} className={historyLinkClass}>
            작성자의 관리자 삭제 기록
          </Link>
          {post.deletedBy && post.deletedByRole === "ADMIN" && (
            <Link href={historyHref({ deletedBy: String(post.deletedBy) })} className={historyLinkClass}>
              관리자의 전체 삭제 기록
            </Link>
          )}
          <Link href={`/admin/users/${post.authorId}`} className={historyLinkClass}>
            작성자 회원 정보
          </Link>
        </div>
        <p className="typo-regular-12 leading-relaxed text-gray-500">
          닉네임은 현재 값이며, 삭제된 글은 보존된 내용을 표시합니다. 시간은 한국 표준시입니다.
        </p>
      </div>
    </HistoryFrame>
  );
}
