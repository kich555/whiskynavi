"use client";

import SingleImageUploader from "@/app/admin/_components/SingleImageUploader";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

import AdminHeader from "../../../_components/AdminHeader";
import { useSidebar } from "../../../_components/AdminLayoutClient";
import { MAX_BOTTLE_IMAGE_SIZE_MB } from "../../../products/image-constraints";
import { createSeriesAction } from "../../actions";

interface SeriesCreateContentProps {
  brandOptions: string[];
}

export default function SeriesCreateContent({ brandOptions }: SeriesCreateContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [brandValue, setBrandValue] = useState("");

  const [formState, formAction, isPending] = useActionState(createSeriesAction, { success: false });

  return (
    <>
      <AdminHeader title="시리즈 등록" onToggleSidebar={toggle} showSearch={false} />

      <form action={formAction} className="p-8">
        <input type="hidden" name="brand" value={brandValue} />

        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            시리즈 목록으로 돌아가기
          </button>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || isImageUploading}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
            >
              <Save size={16} />
              {isImageUploading ? "이미지 업로드 중..." : isPending ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/series")}
              disabled={isPending}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300 disabled:opacity-50"
            >
              <X size={16} />
              취소
            </button>
          </div>
        </div>

        {formState.error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 typo-medium-14 text-red-600">
            {formState.error}
          </div>
        )}

        <div className="flex gap-6 divide-x divide-gray-200 rounded-lg border border-gray-200 bg-white p-6">
          {/* 왼쪽: 필드 */}
          <div className="flex-1 space-y-4 pr-6">
            <div className="flex items-center gap-3">
              <Label required className="typo-medium-14 flex w-28 items-center gap-1 text-gray-700">
                브랜드명
              </Label>
              <div className="flex-1">
                <Select value={brandValue} onValueChange={setBrandValue}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="브랜드를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {brandOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Label required className="typo-medium-14 flex w-28 items-center gap-1 text-gray-700">
                시리즈명
              </Label>
              <input
                type="text"
                name="series"
                maxLength={50}
                required
                className="typo-medium-14 flex-1 rounded border border-gray-300 px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-3">
              <Label className="typo-medium-14 w-28 text-gray-700">시리즈 설명</Label>
              <textarea
                name="description"
                rows={4}
                className="typo-medium-14 flex-1 rounded border border-gray-300 px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-3 rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="typo-medium-14 w-28 text-gray-700">노출 설정</span>
              <label className="typo-medium-14 flex cursor-pointer items-center gap-2 text-gray-900">
                <input
                  type="checkbox"
                  name="visible"
                  value="on"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                사용자 페이지 노출
              </label>
            </div>
          </div>

          {/* 오른쪽: 대표 이미지 */}
          <div className="w-72 pl-6">
            <Label className="typo-medium-14 mb-2 block text-gray-700">대표 이미지</Label>
            <SingleImageUploader
              purpose="BOTTLE"
              maxSizeMB={MAX_BOTTLE_IMAGE_SIZE_MB}
              onUploadingChange={setIsImageUploading}
            />
          </div>
        </div>
      </form>
    </>
  );
}