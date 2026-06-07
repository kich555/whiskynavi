"use client";

import type { AdminBannerResponse } from "@/apis/generated/api";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";
import AdminHeader from "../../../../_components/AdminHeader";
import { useSidebar } from "../../../../_components/AdminLayoutClient";
import ImageUploadArea from "../../../_components/ImageUploadArea";
import { updateBannerFormAction } from "../../../actions";

interface BannerEditContentProps {
  banner: AdminBannerResponse;
}

export default function BannerEditContent({ banner }: BannerEditContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();

  const updateAction = updateBannerFormAction.bind(null, banner.id as number);
  const [formState, formAction, isPending] = useActionState(updateAction, {
    success: false,
  });

  const bgInputRef = useRef<HTMLInputElement>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(banner.backgroundUrl ?? null);

  const handleBgChange = (file: File | null) => {
    if (bgPreview && bgPreview.startsWith("blob:")) {
      URL.revokeObjectURL(bgPreview);
    }
    setBgPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleBgRemove = () => {
    if (bgPreview && bgPreview.startsWith("blob:")) {
      URL.revokeObjectURL(bgPreview);
    }
    setBgPreview(null);
    if (bgInputRef.current) bgInputRef.current.value = "";
  };

  return (
    <>
      <AdminHeader title="배너 편집" onToggleSidebar={toggle} showSearch={false} />

      <form action={formAction} className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            배너 상세로 돌아가기
          </button>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
            >
              <Save size={16} />
              {isPending ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/admin/banners/${banner.id}`)}
              disabled={isPending}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300 disabled:opacity-50"
            >
              <X size={16} />
              취소
            </button>
          </div>
        </div>

        {formState.error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {formState.error}
          </div>
        ) : null}

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid gap-6">
            <div>
              <Label htmlFor="title">제목</Label>
              <input
                id="title"
                name="title"
                type="text"
                defaultValue={banner.title ?? ""}
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
                defaultValue={banner.description ?? ""}
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
                defaultValue={banner.link ?? ""}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="클릭 시 이동할 URL (선택)"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <ImageUploadArea
                label="배경 이미지"
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
