"use client";

import type { AdminBottleReservationNoticeResponse } from "@/apis/generated/api";
import { ArrowLeft, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import AdminHeader from "../../../../_components/AdminHeader";
import { useSidebar } from "../../../../_components/AdminLayoutClient";
import { updateNoticeFormAction } from "../../../actions";
import NoticeFormFields from "../../../new/_components/NoticeFormFields";

interface NoticeEditContentProps {
  notice: AdminBottleReservationNoticeResponse;
}

export default function NoticeEditContent({ notice }: NoticeEditContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();

  const updateAction = updateNoticeFormAction.bind(null, notice.id as number);
  const [formState, formAction, isPending] = useActionState(updateAction, {
    success: false,
  });

  const [uploading, setUploading] = useState(false);
  const submitDisabled = isPending || uploading;
  return (
    <>
      <AdminHeader title="예약 공고 편집" onToggleSidebar={toggle} showSearch={false} />

      <form action={formAction} className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            공고 상세로 돌아가기
          </button>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitDisabled}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
            >
              <Save size={16} />
              {isPending ? "저장 중..." : uploading ? "이미지 업로드 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/admin/reservations/${notice.id}`)}
              disabled={isPending}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300 disabled:opacity-50"
            >
              <X size={16} />
              취소
            </button>
          </div>
        </div>

        {formState.error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {formState.error}
          </div>
        )}

        <NoticeFormFields
          key={JSON.stringify(formState.values ?? null)}
          defaultValues={notice}
          formValues={formState.values}
          onUploadingChange={setUploading}
        />
      </form>
    </>
  );
}
