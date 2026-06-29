"use client";

import type { AdminBoardResponse, AdminBoardResponseReadRole, AdminBoardResponseWriteRole } from "@/apis/generated/api";
import { Eye, EyeOff, Lock, Plus, Trash2, Unlock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import AdminHeader from "@/app/admin/_components/AdminHeader";
import { useSidebar } from "@/app/admin/_components/AdminLayoutClient";
import Pagination from "@/app/admin/_components/Pagination";
import { deleteBoardAction } from "../actions";

const ROLE_LABELS: Record<AdminBoardResponseReadRole | AdminBoardResponseWriteRole, string> = {
  ROLE_GUEST: "방문자",
  ROLE_USER: "일반회원",
  ROLE_ADMIN: "관리자",
  ROLE_SUPER_ADMIN: "최고관리자",
  ROLE_CONSUMER: "소비자",
  ROLE_WHISKYNAVI_MEMBER: "위스키내비",
  ROLE_WHISKYTALES_MEMBER: "위스키테일즈",
  ROLE_BLIND_MEMBER: "블라인드",
  ROLE_BUSINESS: "사업자",
  ROLE_TRAILNTALE_BUSINESS: "TrailTale 사업자",
  ROLE_COMMUNITY_BUSINESS: "커뮤니티 사업자",
  ROLE_PICK_UP_BUSINESS: "픽업 사업자",
};

interface BoardsContentProps {
  searchParams: {
    page?: string;
    limit?: string;
  };
  boards: AdminBoardResponse[];
  totalElements: number;
}

export default function BoardsContent({ searchParams, boards, totalElements }: BoardsContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;

  const runAction = (action: () => Promise<{ success: boolean; error?: string }>, successMessage: string) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success(successMessage);
        router.refresh();
      } else {
        toast.error(result.error ?? "작업에 실패했습니다.");
      }
    });
  };

  const deleteBoard = (board: AdminBoardResponse) => {
    if (!board.id) return;
    if (!window.confirm(`"${board.name ?? `ID ${board.id}`}" 게시판을 삭제하시겠습니까?\n\n게시글이나 공지가 있으면 삭제할 수 없습니다.`)) return;
    runAction(() => deleteBoardAction(board.id!), "게시판을 삭제했습니다.");
  };

  return (
    <>
      <AdminHeader title="게시판 관리" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/admin/boards/new")}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700"
          >
            <Plus size={16} />
            게시판 생성
          </button>
        </div>

        {boards.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white py-20 text-center">
            <p className="text-gray-500">등록된 게시판이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">게시판명</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">슬러그</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">설명</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">활성</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">숨김</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">읽기전용</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">읽기 권한</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">쓰기 권한</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {boards.map((board) => (
                  <tr key={board.id} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{board.id}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{board.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 font-mono">{board.slug}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-xs text-gray-500">{board.description ?? "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          board.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {board.active ? <Eye size={12} /> : <EyeOff size={12} />}
                        {board.active ? "ON" : "OFF"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          board.hidden ? "bg-yellow-50 text-yellow-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {board.hidden ? <Lock size={12} /> : <Unlock size={12} />}
                        {board.hidden ? "숨김" : "노출"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          board.readOnly ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {board.readOnly ? "ON" : "OFF"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                      {board.readRole ? ROLE_LABELS[board.readRole] ?? board.readRole : "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                      {board.writeRole ? ROLE_LABELS[board.writeRole] ?? board.writeRole : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => router.push(`/admin/boards/${board.id}`)}
                          className="cursor-pointer rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
                        >
                          상세
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => deleteBoard(board)}
                          className="cursor-pointer rounded border border-red-200 px-2.5 py-1 text-xs text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
            basePath="/admin/boards"
          />
        </div>
      </div>
    </>
  );
}