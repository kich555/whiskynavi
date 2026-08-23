"use client";

import type { BottleAdminResponse } from "@/apis/generated/api";
import { ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import type { ReactNode } from "react";
import AdminHeader from "../../../_components/AdminHeader";
import { useSidebar } from "../../../_components/AdminLayoutClient";
import AdminProductDetailView from "../../../components/AdminProductDetailView";
import ProductDeleteModal from "./ProductDeleteModal";

interface ProductDetailContentProps {
  product: BottleAdminResponse;
  children?: ReactNode;
}

export default function ProductDetailContent({ product, children }: ProductDetailContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();

  return (
    <>
      <AdminHeader title="제품 상세" onToggleSidebar={toggle} showSearch={false} />
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            보틀 목록으로 돌아가기
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push(`/admin/products/${product.id}/edit`)}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700"
            >
              <Edit2 size={16} />
              편집
            </button>
            <button
              type="button"
              onClick={() => overlay.open((props) => <ProductDeleteModal {...props} id={product.id!} />)}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              <Trash2 size={16} />
              삭제
            </button>
          </div>
        </div>

        <AdminProductDetailView productDetails={product} />
        {children}
      </div>
    </>
  );
}
