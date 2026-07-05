"use client";

import type { AdminUserOrderSummaryResponse, AdminUserResponse } from "@/apis/generated/api";
import { ArrowLeft, Edit2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import AdminHeader from "../../../_components/AdminHeader";
import { useSidebar } from "../../../_components/AdminLayoutClient";
import AdminUserDetailSection from "../../../components/AdminUserDetailSection";
import ManualPurchaseCreateModal from "./ManualPurchaseCreateModal";
import UserDeleteModal from "./UserDeleteModal";

interface UserDetailContentProps {
  user: AdminUserResponse;
  orderSummary: AdminUserOrderSummaryResponse;
}

export default function UserDetailContent({ user, orderSummary }: UserDetailContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const userId = user.id;

  const openManualPurchaseModal = () => {
    if (userId == null) return;
    overlay.open((props) => <ManualPurchaseCreateModal {...props} userId={userId} />);
  };

  return (
    <>
      <AdminHeader title="회원 상세" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            회원 목록으로 돌아가기
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openManualPurchaseModal}
              disabled={userId == null}
              className="typo-medium-14 flex cursor-pointer items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={14} />
              구매내역 추가
            </button>
            <button
              type="button"
              onClick={() => router.push(`/admin/users/${user.id}/edit`)}
              className="typo-medium-14 flex cursor-pointer items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-white transition-colors hover:bg-amber-700"
            >
              <Edit2 size={14} />
              수정
            </button>
            <button
              type="button"
              onClick={() => overlay.open((props) => <UserDeleteModal {...props} id={user.id!} />)}
              className="typo-medium-14 flex cursor-pointer items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-white transition-colors hover:bg-red-700"
            >
              <Trash2 size={14} />
              삭제
            </button>
          </div>
        </div>
        <AdminUserDetailSection
          isEditMode={false}
          userDetails={user}
          orderSummary={orderSummary}
          onAddManualPurchase={openManualPurchaseModal}
        />
      </div>
    </>
  );
}
