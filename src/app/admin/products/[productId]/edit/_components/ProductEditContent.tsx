"use client";

import type { BottleAdminParameterValues, BottleAdminResponse } from "@/apis/generated/api";
import { ArrowLeft, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import AdminHeader from "../../../../_components/AdminHeader";
import { useSidebar } from "../../../../_components/AdminLayoutClient";
import AdminProductDetailEdit from "../../../../components/AdminProductDetailEdit";
import { updateBottleFormAction } from "../../../actions";

interface ProductEditContentProps {
  product: BottleAdminResponse;
  parameterValues?: BottleAdminParameterValues;
}

export default function ProductEditContent({ product, parameterValues }: ProductEditContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const updateAction = updateBottleFormAction.bind(null, product.id as number);
  const [formState, formAction, isPending] = useActionState(updateAction, {
    success: false,
  });

  const handleFormAction = (formData: FormData) => {
    if (selectedFile) {
      formData.set("labelImg", selectedFile);
    } else {
      formData.delete("labelImg");
    }
    formAction(formData);
  };

  return (
    <>
      <AdminHeader title="제품 편집" onToggleSidebar={toggle} showSearch={false} />

      <form action={handleFormAction} className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            제품 상세로 돌아가기
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
              onClick={() => router.push(`/admin/products/${product.id}`)}
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

        <AdminProductDetailEdit
          defaultValues={product}
          submittedValues={formState.values}
          parameterValues={parameterValues}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
        />
      </form>
    </>
  );
}
