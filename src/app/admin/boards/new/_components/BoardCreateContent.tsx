"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import AdminHeader from "@/app/admin/_components/AdminHeader";
import { useSidebar } from "@/app/admin/_components/AdminLayoutClient";
import BoardFormFields from "../../_components/BoardFormFields";
import type { FormState } from "../../actions";
import { createBoardFormAction } from "../../actions";

export default function BoardCreateContent() {
  const { toggle } = useSidebar();
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<FormState, FormData>(createBoardFormAction, {
    success: false,
  });

  useEffect(() => {
    if (state.success) {
      toast.success("게시판을 생성했습니다.");
    }
  }, [state.success]);

  return (
    <>
      <AdminHeader title="게시판 생성" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        <button
          type="button"
          onClick={() => router.push("/admin/boards")}
          className="mb-6 inline-flex cursor-pointer items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ArrowLeft size={16} />
          게시판 목록으로
        </button>

        <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-8">
          <h2 className="typo-bold-20 mb-8 text-gray-900">새 게시판</h2>

          {state.error && (
            <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</div>
          )}

          <form action={formAction} className="space-y-6">
            <BoardFormFields />

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push("/admin/boards")}
                className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="cursor-pointer rounded-lg bg-amber-600 px-6 py-2 text-sm text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
              >
                {isPending ? "생성 중..." : "게시판 생성"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}