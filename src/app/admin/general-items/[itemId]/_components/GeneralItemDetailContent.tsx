"use client";

import type { ItemAdminResponse } from "@/apis/generated/api";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";
import AdminHeader from "../../../_components/AdminHeader";
import { useSidebar } from "../../../_components/AdminLayoutClient";
import ImageUploadArea from "../../../banners/_components/ImageUploadArea";
import { updateGeneralItemFormAction } from "../../actions";
import { MAX_GENERAL_ITEM_IMAGE_SIZE_MB } from "../../image-constraints";

interface GeneralItemDetailContentProps {
  item: ItemAdminResponse;
}

function stringifyExtraInfos(extraInfos: ItemAdminResponse["extraInfos"]) {
  if (!extraInfos) return "";
  return JSON.stringify(extraInfos, null, 2);
}

function revokePreviewUrl(url: string | null) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

export default function GeneralItemDetailContent({ item }: GeneralItemDetailContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(item.imageUrl ?? null);
  const [formState, formAction, isPending] = useActionState(updateGeneralItemFormAction.bind(null, item.id ?? 0), {
    success: false,
  });

  const values = formState.values ?? {};

  const handleFileChange = (file: File | null) => {
    revokePreviewUrl(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleRemove = () => {
    revokePreviewUrl(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <AdminHeader title="일반상품 상세조회" onToggleSidebar={toggle} showSearch={false} />

      <form action={formAction} className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            일반상품 목록으로 돌아가기
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

        {formState.success ? (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            일반상품 정보가 수정되었습니다.
          </div>
        ) : null}

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-5">
              <div>
                <label className="typo-medium-14 mb-2 block text-gray-700" htmlFor="name">
                  상품명 *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={values.name ?? item.name ?? ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="배송 주문용 일반상품명을 입력하세요"
                />
              </div>

              <div>
                <label className="typo-medium-14 mb-2 block text-gray-700" htmlFor="description">
                  상품 설명
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  defaultValue={values.description ?? item.description ?? ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="주문 화면에 참고할 상품 설명을 입력하세요"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="typo-medium-14 mb-2 block text-gray-700" htmlFor="stockQuantity">
                    재고 수량
                  </label>
                  <input
                    id="stockQuantity"
                    name="stockQuantity"
                    type="number"
                    min={0}
                    defaultValue={values.stockQuantity ?? item.stockQuantity ?? ""}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="typo-medium-14 mb-2 block text-gray-700" htmlFor="consumerPrice">
                    소비자가
                  </label>
                  <input
                    id="consumerPrice"
                    name="consumerPrice"
                    type="number"
                    min={0}
                    defaultValue={values.consumerPrice ?? item.consumerPrice ?? ""}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="typo-medium-14 mb-2 block text-gray-700" htmlFor="supplyPrice">
                    공급가
                  </label>
                  <input
                    id="supplyPrice"
                    name="supplyPrice"
                    type="number"
                    min={0}
                    defaultValue={values.supplyPrice ?? item.supplyPrice ?? ""}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="typo-medium-14 mb-2 block text-gray-700" htmlFor="extraInfos">
                  추가 정보 JSON
                </label>
                <textarea
                  id="extraInfos"
                  name="extraInfos"
                  rows={5}
                  defaultValue={values.extraInfos ?? stringifyExtraInfos(item.extraInfos)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder='{"details":{"material":"glass","origin":"korea"}}'
                />
              </div>

              <input type="hidden" name="visible" defaultValue={values.visible || (item.visible ? "on" : "")} />
            </div>

            <div className="grid gap-5">
              <ImageUploadArea
                label="대표 이미지"
                name="imageFile"
                previewUrl={previewUrl}
                inputRef={inputRef}
                onFileChange={handleFileChange}
                onRemove={handleRemove}
                maxSizeMB={MAX_GENERAL_ITEM_IMAGE_SIZE_MB}
              />
              <input type="hidden" name="imageKey" defaultValue={values.imageKey ?? item.imageKey ?? ""} />
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
