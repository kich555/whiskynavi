import type { AdminBoardPostHistoryResponse } from "@/apis/generated/api";
import Link from "next/link";
import { historyHref, historyNickname, historyStatus } from "../_lib/history";

export const historyLinkClass =
  "text-amber-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600";

export function HistoryPerson({ post, kind }: { post: AdminBoardPostHistoryResponse; kind: "author" | "admin" }) {
  const id = kind === "author" ? post.authorId : post.deletedBy;
  const nickname = historyNickname(kind === "author" ? post.authorNickname : post.deletedByNickname);
  const canTrack = id != null && (kind === "author" || post.deletedByRole === "ADMIN");
  const label = kind === "author" ? "작성 이력" : "삭제 이력";
  return (
    <div>
      {canTrack ? (
        <Link
          href={
            kind === "author"
              ? historyHref({ mode: "posts", authorId: String(id) })
              : historyHref({ deletedBy: String(id) })
          }
          className={historyLinkClass}
          title={`${nickname}의 ${label} 조회`}
        >
          {nickname}
        </Link>
      ) : (
        <span>{id != null ? nickname : "삭제자 정보 없음"}</span>
      )}
      <span className="typo-regular-12 mt-1 block text-gray-500">
        {id != null ? `#${id}${canTrack ? ` · ${label} 보기` : ""}` : "-"}
      </span>
    </div>
  );
}

export function HistoryStatus({ post }: { post: AdminBoardPostHistoryResponse }) {
  const colors = !post.deleted
    ? "bg-emerald-50 text-emerald-800"
    : post.deletedByRole === "ADMIN"
      ? "bg-red-50 text-red-800"
      : "bg-gray-100 text-gray-700";
  return (
    <span className={`typo-medium-12 inline-flex rounded-full px-2.5 py-1.5 ${colors}`}>{historyStatus(post)}</span>
  );
}
