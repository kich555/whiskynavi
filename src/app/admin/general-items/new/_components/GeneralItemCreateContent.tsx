"use client";

import { getImageTypeError, IMAGE_FILE_ACCEPT } from "@/lib/image-upload";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";
import AdminHeader from "../../../_components/AdminHeader";
import { useSidebar } from "../../../_components/AdminLayoutClient";
import ImageUploadArea from "../../../banners/_components/ImageUploadArea";
import { createGeneralItemFormAction } from "../../actions";
import { MAX_GENERAL_ITEM_IMAGE_SIZE_MB } from "../../image-constraints";

function buildSaleCreateHref(itemId?: number, itemName?: string, salePrice?: number, totalQuantity?: number) {
  const params = new URLSearchParams();
  if (itemId != null) params.set("productId", String(itemId));
  if (itemName) params.set("itemName", itemName);
  if (salePrice != null) params.set("salePrice", String(salePrice));
  if (totalQuantity != null) params.set("totalQuantity", String(totalQuantity));
  const query = params.toString();
  return query ? `/admin/general-item-sales/new?${query}` : "/admin/general-item-sales/new";
}

export default function GeneralItemCreateContent() {
  const { toggle } = useSidebar();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formState, formAction, isPending] = useActionState(createGeneralItemFormAction, { success: false });

  const handleFileChange = (file: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const values = formState.values ?? {};
  const createdItem = formState.success ? formState.data : undefined;

  return (
    <>
      <AdminHeader title="일반상품 등록" onToggleSidebar={toggle} showSearch={false} />

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
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 typo-medium-14 text-red-600">
            {formState.error}
          </div>
        ) : null}

        {createdItem ? (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 typo-medium-14 text-green-800">
            <p className="font-semibold">일반상품이 등록되었습니다. 상품 ID: {createdItem.id}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={buildSaleCreateHref(
                  createdItem.id,
                  createdItem.name,
                  createdItem.consumerPrice,
                  createdItem.stockQuantity,
                )}
                className="rounded-md bg-green-700 px-3 py-2 text-white hover:bg-green-800"
              >
                이 상품으로 일반상품판매공고 등록
              </Link>
              <Link href="/admin/general-items" className="rounded-md border border-green-300 px-3 py-2 hover:bg-white">
                목록 보기
              </Link>
            </div>
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
                  defaultValue={values.name}
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
                  defaultValue={values.description}
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
                    defaultValue={values.stockQuantity}
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
                    defaultValue={values.consumerPrice}
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
                    defaultValue={values.supplyPrice}
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
                  defaultValue={values.extraInfos}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono typo-medium-14 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder='{"details":{"material":"glass","origin":"korea"}}'
                />
              </div>

              <input type="hidden" name="visible" defaultValue="on" />
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
                accept={IMAGE_FILE_ACCEPT}
                validateFile={getImageTypeError}
              />
              <input type="hidden" name="imageKey" defaultValue={values.imageKey ?? ""} />
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
