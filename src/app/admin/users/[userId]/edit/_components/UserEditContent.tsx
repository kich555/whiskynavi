"use client";

import type { AdminUserResponse } from "@/apis/generated/api";
import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import { useTransition } from "react";
import { toast } from "sonner";
import AdminHeader from "../../../../_components/AdminHeader";
import { useSidebar } from "../../../../_components/AdminLayoutClient";
import AdminUserDetailSection from "../../../../components/AdminUserDetailSection";
import {
  addUserRolesAction,
  removeUserRolesAction,
  updateUserStatusAction,
} from "../../../actions";
import ManualPurchaseCreateModal from "../../_components/ManualPurchaseCreateModal";

interface UserEditContentProps {
  user: AdminUserResponse;
}

export default function UserEditContent({ user }: UserEditContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const userId = user.id;

  const openManualPurchaseModal = () => {
    if (userId == null) return;
    overlay.open((props) => <ManualPurchaseCreateModal {...props} userId={userId} />);
  };

  const handleStatusToggle = (newStatus: string) => {
    startTransition(async () => {
      const result = await updateUserStatusAction(user.id!, newStatus);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleAddRole = (role: string) => {
    startTransition(async () => {
      const result = await addUserRolesAction(user.id!, [role]);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleRemoveRole = (role: string) => {
    startTransition(async () => {
      const result = await removeUserRolesAction(user.id!, [role]);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      <AdminHeader title="회원 정보 수정" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            회원 상세로 돌아가기
          </button>
          <button
            type="button"
            onClick={openManualPurchaseModal}
            disabled={userId == null}
            className="typo-medium-14 flex cursor-pointer items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} />
            구매내역 추가
          </button>
        </div>

        <AdminUserDetailSection
          isEditMode
          userDetails={user}
          onStatusToggle={handleStatusToggle}
          onAddRole={handleAddRole}
          onRemoveRole={handleRemoveRole}
          isSaving={isPending}
        />
      </div>
    </>
  );
}
