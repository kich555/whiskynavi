"use client";

import type { AdminBoardResponse } from "@/apis/generated/api";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { toast } from "sonner";
import AdminHeader from "@/app/admin/_components/AdminHeader";
import { useSidebar } from "@/app/admin/_components/AdminLayoutClient";
import BoardFormFields from "../../../_components/BoardFormFields";
import type { FormState } from "../../../actions";
import { updateBoardFormAction } from "../../../actions";

interface BoardEditContentProps {
  board: AdminBoardResponse;
}

export default function BoardEditContent({ board }: BoardEditContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();

  const boundAction = updateBoardFormAction.bind(null, board.id!);
  const [state, formAction, isPending] = useActionState<FormState, FormData>(boundAction, { success: false });

  if (state.success) {
    toast.success("게시판을 수정했습니다.");
  }

  return (
    <>
      <AdminHeader title="게시판 수정" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        <button
          type="button"
          onClick={() => router.push(`/admin/boards/${board.id}`)}
          className="mb-6 inline-flex cursor-pointer items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ArrowLeft size={16} />
          게시판 상세로
        </button>

        <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-8">
          <h2 className="typo-bold-20 mb-8 text-gray-900">게시판 수정</h2>

          {state.error && (
            <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</div>
          )}

          <form action={formAction} className="space-y-6">
            <BoardFormFields initialData={board} />

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push(`/admin/boards/${board.id}`)}
                className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="cursor-pointer rounded-lg bg-amber-600 px-6 py-2 text-sm text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
              >
                {isPending ? "수정 중..." : "게시판 수정"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}