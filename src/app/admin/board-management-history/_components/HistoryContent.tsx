import type { AdminBoardPostHistoryResponse } from "@/apis/generated/api";
import Link from "next/link";
import {
  formatHistoryDate,
  HISTORY_PATH,
  historyDetailHref,
  historyHref,
  historyNickname,
  historyQuery,
  type HistoryFilters,
} from "../_lib/history";
import { historyLinkClass, HistoryPerson, HistoryStatus } from "./HistoryRecord";

interface Props {
  filters: HistoryFilters;
  records: AdminBoardPostHistoryResponse[];
  total: number;
}

export default function HistoryContent({ filters, records, total }: Props) {
  const isDeleted = filters.mode === "deleted";
  const page = Number(filters.page);
  const size = Number(filters.limit);
  const totalPages = Math.max(1, Math.ceil(total / size));
  const exactAuthor = filters.authorId
    ? records.find((record) => String(record.authorId) === filters.authorId)
    : undefined;
  const exactAdmin = filters.deletedBy
    ? records.find((record) => String(record.deletedBy) === filters.deletedBy)
    : undefined;
  const tabClass = "typo-bold-14 rounded-lg px-4 py-3 focus-visible:outline-2 focus-visible:outline-amber-600";
  const hasFilters = Boolean(
    filters.authorId || filters.deletedBy || filters.authorNickname || filters.deletedByNickname || filters.keyword,
  );

  return (
    <div className="space-y-5">
      <nav aria-label="관리기록 종류" className="flex flex-wrap gap-2">
        <Link
          href={historyHref({ ...filters, mode: "deleted", page: "1" })}
          aria-current={isDeleted ? "page" : undefined}
          className={`${tabClass} ${isDeleted ? "bg-amber-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
        >
          관리자 삭제 기록
        </Link>
        <Link
          href={historyHref({ ...filters, mode: "posts", page: "1" })}
          aria-current={!isDeleted ? "page" : undefined}
          className={`${tabClass} ${!isDeleted ? "bg-amber-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
        >
          게시글 작성 이력
        </Link>
      </nav>

      <div>
        <h1 className="typo-bold-20 text-gray-900">{isDeleted ? "관리자 삭제 기록" : "게시글 작성 이력"}</h1>
        <p className="typo-regular-14 mt-2 leading-relaxed text-gray-600">
          {isDeleted
            ? "삭제 사유를 확인하고 작성자·관리자의 활동을 이어서 살펴보세요."
            : "활성 글과 삭제 글을 함께 조회합니다. 작성자 닉네임을 선택하면 해당 사용자의 전체 작성 이력을 볼 수 있습니다."}
        </p>
      </div>

      <form
        key={historyQuery(filters)}
        action={HISTORY_PATH}
        method="get"
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 md:p-5"
      >
        <input type="hidden" name="mode" value={filters.mode} />
        {filters.authorId && <input type="hidden" name="authorId" value={filters.authorId} />}
        {filters.deletedBy && <input type="hidden" name="deletedBy" value={filters.deletedBy} />}
        {(filters.authorId || filters.deletedBy) && (
          <div className="flex flex-wrap gap-2">
            {filters.authorId && (
              <span className="typo-medium-12 inline-flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
                작성자: {exactAuthor ? historyNickname(exactAuthor.authorNickname) : "선택한 사용자"} (#
                {filters.authorId})
                <Link
                  href={historyHref({ ...filters, authorId: undefined, authorNickname: undefined, page: "1" })}
                  className="underline"
                  aria-label="작성자 한정 해제"
                >
                  해제
                </Link>
              </span>
            )}
            {filters.deletedBy && (
              <span className="typo-medium-12 inline-flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
                삭제 관리자: {exactAdmin ? historyNickname(exactAdmin.deletedByNickname) : "선택한 관리자"} (#
                {filters.deletedBy})
                <Link
                  href={historyHref({ ...filters, deletedBy: undefined, deletedByNickname: undefined, page: "1" })}
                  className="underline"
                  aria-label="삭제 관리자 한정 해제"
                >
                  해제
                </Link>
              </span>
            )}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="typo-medium-12 space-y-2 text-gray-600">
            <span>게시글 제목</span>
            <input
              name="keyword"
              maxLength={100}
              defaultValue={filters.keyword}
              placeholder="제목 검색"
              className="typo-regular-14 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-amber-500 focus:outline-none"
            />
          </label>
          <label className="typo-medium-12 space-y-2 text-gray-600">
            <span>작성자 닉네임</span>
            <input
              name="authorNickname"
              maxLength={100}
              defaultValue={filters.authorNickname}
              placeholder="닉네임 검색"
              className="typo-regular-14 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-amber-500 focus:outline-none"
            />
          </label>
          {isDeleted && (
            <label className="typo-medium-12 space-y-2 text-gray-600">
              <span>삭제 관리자 닉네임</span>
              <input
                name="deletedByNickname"
                maxLength={100}
                defaultValue={filters.deletedByNickname}
                placeholder="관리자 닉네임 검색"
                className="typo-regular-14 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-amber-500 focus:outline-none"
              />
            </label>
          )}
          <label className="typo-medium-12 space-y-2 text-gray-600">
            <span>페이지당 표시</span>
            <select
              name="limit"
              defaultValue={filters.limit}
              className="typo-regular-14 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900"
            >
              {[10, 20, 50, 100].map((value) => (
                <option key={value} value={value}>
                  {value}건
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="typo-bold-14 rounded-lg bg-amber-600 px-5 py-2.5 text-white hover:bg-amber-700"
          >
            검색
          </button>
          <Link
            href={historyHref({ mode: filters.mode, limit: filters.limit })}
            className="typo-medium-14 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 hover:bg-gray-50"
          >
            초기화
          </Link>
          <p className="typo-regular-12 leading-relaxed text-gray-500">
            닉네임은 현재 값으로 표시됩니다. 이름이 바뀌어도 선택한 사람의 이력은 유지됩니다.
          </p>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="typo-bold-14 text-gray-800">
          {hasFilters ? "검색 결과" : "전체"} {total.toLocaleString("ko-KR")}건
        </p>
        <p className="typo-regular-12 text-gray-500">{isDeleted ? "삭제 최신순" : "작성 최신순"} · 한국 표준시</p>
      </div>

      {records.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-16 text-center">
          <p className="typo-bold-16 text-gray-800">
            {hasFilters ? "조건에 맞는 기록이 없습니다." : "아직 기록이 없습니다."}
          </p>
          <p className="typo-regular-14 mt-3 text-gray-500">
            {hasFilters
              ? "닉네임이나 제목을 바꾸거나 검색 조건을 초기화해 주세요."
              : "게시글이 등록되거나 관리자가 삭제하면 이곳에서 확인할 수 있습니다."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white lg:block">
            <table className="w-full table-fixed text-left">
              <caption className="sr-only">
                {isDeleted ? "관리자 삭제 기록" : "게시글 작성 이력"}. 제목을 선택하면 본문을, 닉네임을 선택하면 해당
                사람의 이력을 조회합니다.
              </caption>
              <thead className="typo-bold-12 border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th scope="col" className="w-[16%] px-4 py-3">
                    {isDeleted ? "삭제 일시" : "작성 일시"}
                  </th>
                  <th scope="col" className="w-[28%] px-4 py-3">
                    게시글
                  </th>
                  <th scope="col" className="w-[15%] px-4 py-3">
                    작성자
                  </th>
                  <th scope="col" className="w-[15%] px-4 py-3">
                    처리 상태 / 삭제자
                  </th>
                  <th scope="col" className="w-[26%] px-4 py-3">
                    삭제 사유
                  </th>
                </tr>
              </thead>
              <tbody className="typo-regular-14 divide-y divide-gray-100 text-gray-700">
                {records.map((post) => (
                  <tr key={post.postId} className="align-top hover:bg-gray-50">
                    <td className="px-4 py-4 leading-relaxed">
                      {formatHistoryDate(isDeleted ? post.deletedAt : post.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={historyDetailHref(post.postId, filters)}
                        className={`typo-bold-14 leading-relaxed break-words ${historyLinkClass}`}
                      >
                        {post.title || "제목 없음"}
                      </Link>
                      <p className="typo-regular-12 mt-2 leading-relaxed break-words text-gray-500">
                        {post.boardName ?? "게시판 정보 없음"} · #{post.postId}
                      </p>
                    </td>
                    <td className="px-4 py-4 break-words">
                      <HistoryPerson post={post} kind="author" />
                    </td>
                    <td className="space-y-3 px-4 py-4 break-words">
                      <HistoryStatus post={post} />
                      {post.deleted && <HistoryPerson post={post} kind="admin" />}
                    </td>
                    <td className="px-4 py-4">
                      <p className="line-clamp-3 leading-relaxed break-words whitespace-pre-wrap">
                        {post.deleteReason ||
                          (post.deletedByRole === "USER" ? "작성자가 직접 삭제한 게시글입니다." : "-")}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 lg:hidden">
            {records.map((post) => (
              <article key={post.postId} className="min-w-0 rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <HistoryStatus post={post} />
                  <span className="typo-regular-12 text-gray-500">
                    {formatHistoryDate(isDeleted ? post.deletedAt : post.createdAt)}
                  </span>
                </div>
                <Link
                  href={historyDetailHref(post.postId, filters)}
                  className={`typo-bold-16 block leading-relaxed break-words ${historyLinkClass}`}
                >
                  {post.title || "제목 없음"}
                </Link>
                <p className="typo-regular-12 mt-2 text-gray-500">
                  {post.boardName ?? "게시판 정보 없음"} · #{post.postId}
                </p>
                <div className="typo-regular-14 mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div className="min-w-0 break-words">
                    <p className="typo-medium-12 mb-2 text-gray-500">작성자</p>
                    <HistoryPerson post={post} kind="author" />
                  </div>
                  {post.deleted && (
                    <div className="min-w-0 break-words">
                      <p className="typo-medium-12 mb-2 text-gray-500">삭제자</p>
                      <HistoryPerson post={post} kind="admin" />
                    </div>
                  )}
                </div>
                {post.deleteReason && (
                  <p className="typo-regular-14 mt-4 line-clamp-3 rounded-lg bg-gray-50 p-3 leading-relaxed break-words whitespace-pre-wrap text-gray-700">
                    {post.deleteReason}
                  </p>
                )}
              </article>
            ))}
          </div>
        </>
      )}

      {total > 0 && (
        <nav aria-label="관리기록 페이지" className="flex flex-wrap items-center justify-between gap-3">
          <p className="typo-regular-12 text-gray-600">
            {(page - 1) * size + 1}–{Math.min(page * size, total)} / {total.toLocaleString("ko-KR")}건
          </p>
          <div className="typo-medium-14 flex items-center gap-3">
            {page > 1 ? (
              <Link
                href={historyHref({ ...filters, page: String(page - 1) })}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 hover:bg-gray-50"
              >
                이전
              </Link>
            ) : (
              <span aria-disabled="true" className="px-3 py-2 text-gray-400">
                이전
              </span>
            )}
            <span aria-current="page">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={historyHref({ ...filters, page: String(page + 1) })}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 hover:bg-gray-50"
              >
                다음
              </Link>
            ) : (
              <span aria-disabled="true" className="px-3 py-2 text-gray-400">
                다음
              </span>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
