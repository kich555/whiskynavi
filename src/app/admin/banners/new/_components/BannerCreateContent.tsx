"use client";

import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";
import AdminHeader from "../../../_components/AdminHeader";
import { useSidebar } from "../../../_components/AdminLayoutClient";
import ImageUploadArea from "../../_components/ImageUploadArea";
import { createBannerFormAction } from "../../actions";

export default function BannerCreateContent() {
  const { toggle } = useSidebar();
  const router = useRouter();

  const [formState, formAction, isPending] = useActionState(createBannerFormAction, { success: false });

  const bgInputRef = useRef<HTMLInputElement>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);

  const handleBgChange = (file: File | null) => {
    if (bgPreview) URL.revokeObjectURL(bgPreview);
    setBgPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleBgRemove = () => {
    if (bgPreview) URL.revokeObjectURL(bgPreview);
    setBgPreview(null);
    if (bgInputRef.current) bgInputRef.current.value = "";
  };

  return (
    <>
      <AdminHeader title="배너 등록" onToggleSidebar={toggle} showSearch={false} />

      <form action={formAction} className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            배너 목록으로 돌아가기
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            <Save size={16} />
            {isPending ? "저장 중..." : "저장"}
          </button>
        </div>

        {formState.error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {formState.error}
          </div>
        ) : null}

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid gap-6">
            <div>
              <Label htmlFor="title">제목 *</Label>
              <input
                id="title"
                name="title"
                type="text"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="배너 제목을 입력하세요"
              />
            </div>

            <div>
              <Label htmlFor="description">설명</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="배너 설명을 입력하세요 (선택)"
              />
            </div>

            <div>
              <Label htmlFor="link">링크</Label>
              <input
                id="link"
                name="link"
                type="text"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="클릭 시 이동할 URL (선택)"
              />
            </div>

            <div>
              <ImageUploadArea
                label="배경 이미지 *"
                name="backgroundImg"
                previewUrl={bgPreview}
                inputRef={bgInputRef}
                onFileChange={handleBgChange}
                onRemove={handleBgRemove}
              />
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
