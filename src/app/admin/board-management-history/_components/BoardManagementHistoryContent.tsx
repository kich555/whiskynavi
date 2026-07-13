"use client";

import type { AdminPostDeletionAuditResponse } from "@/apis/generated/api";
import AdminHeader from "@/app/admin/_components/AdminHeader";
import { useSidebar } from "@/app/admin/_components/AdminLayoutClient";
import Pagination from "@/app/admin/_components/Pagination";

interface BoardManagementHistoryContentProps {
  searchParams: {
    page?: string;
    limit?: string;
  };
  records: AdminPostDeletionAuditResponse[];
  totalElements: number;
}

function formatDateTime(value?: string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function BoardManagementHistoryContent({
  searchParams,
  records,
  totalElements,
}: BoardManagementHistoryContentProps) {
  const { toggle } = useSidebar();
  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;

  return (
    <>
      <AdminHeader title="게시판 관리기록" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-4 sm:p-8">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">게시글 삭제 기록</h2>
          <p className="mt-1 text-sm text-gray-500">관리자가 삭제한 게시글과 삭제 사유를 최신순으로 확인합니다.</p>
        </div>

        {records.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white py-20 text-center">
            <p className="text-gray-500">관리자 게시글 삭제 기록이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-[1050px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">삭제 일시</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">게시판</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">게시글</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">작성자</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">삭제 관리자</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">삭제 사유</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((record) => (
                  <tr key={record.postId} className="align-top transition-colors hover:bg-gray-50">
                    <td className="px-4 py-4 text-xs whitespace-nowrap text-gray-600">
                      {formatDateTime(record.deletedAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">
                        {record.boardName ?? `게시판 #${record.boardId}`}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-gray-400">{record.boardSlug ?? "-"}</p>
                    </td>
                    <td className="max-w-[260px] px-4 py-4">
                      <p className="truncate text-sm text-gray-900" title={record.title}>
                        {record.title ?? "제목 없음"}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        #{record.postId} · 작성 {formatDateTime(record.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-600">
                      사용자 #{record.authorId ?? "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-700">관리자 #{record.deletedBy ?? "-"}</p>
                      <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {record.deletedByRole ?? "ADMIN"}
                      </span>
                    </td>
                    <td className="max-w-[320px] px-4 py-4 text-sm break-words whitespace-pre-wrap text-gray-700">
                      {record.deleteReason ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <Pagination
            totalItems={totalElements}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            searchParams={searchParams}
            basePath="/admin/board-management-history"
          />
        </div>
      </div>
    </>
  );
}
