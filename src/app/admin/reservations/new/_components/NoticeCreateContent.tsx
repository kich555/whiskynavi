"use client";

import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import AdminHeader from "../../../_components/AdminHeader";
import { useSidebar } from "../../../_components/AdminLayoutClient";
import { createNoticeFormAction } from "../../actions";
import NoticeFormFields from "./NoticeFormFields";

export default function NoticeCreateContent() {
  const { toggle } = useSidebar();
  const router = useRouter();

  const [formState, formAction, isPending] = useActionState(createNoticeFormAction, { success: false });
  const [uploading, setUploading] = useState(false);
  const submitDisabled = isPending || uploading;

  return (
    <>
      <AdminHeader title="보틀예약공고 등록" onToggleSidebar={toggle} showSearch={false} />

      <form action={formAction} className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            공고 목록으로 돌아가기
          </button>

          <button
            type="submit"
            disabled={submitDisabled}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            <Save size={16} />
            {isPending ? "저장 중..." : uploading ? "이미지 업로드 중..." : "저장"}
          </button>
        </div>

        {formState.error && (
          <div className="typo-medium-14 mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-600">
            {formState.error}
          </div>
        )}

        <NoticeFormFields
          key={JSON.stringify(formState.values ?? null)}
          formValues={formState.values}
          onUploadingChange={setUploading}
        />
      </form>
    </>
  );
}
