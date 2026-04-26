"use client";

import type { AdminBusinessUserDetailResponse } from "@/apis/generated/api";
import AdminHeader from "../../../../_components/AdminHeader";
import { useSidebar } from "../../../../_components/AdminLayoutClient";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { overlay } from "overlay-kit";
import { useRouter } from "next/navigation";
import PickupRoleConfirmModal from "./PickupRoleConfirmModal";

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
};

interface BusinessMemberDetailContentProps {
  member: AdminBusinessUserDetailResponse;
}

export default function BusinessMemberDetailContent({
  member,
}: BusinessMemberDetailContentProps) {
  const router = useRouter();
  const { toggle } = useSidebar();

  const handlePickupRoleAction = (mode: "grant" | "revoke") => {
    overlay.open((props) => (
      <PickupRoleConfirmModal
        {...props}
        userId={member.userId!}
        mode={mode}
      />
    ));
  };

  return (
    <>
      <AdminHeader
        title="사업자 멤버 상세"
        onToggleSidebar={toggle}
        showSearch={false}
      />

      <div className="p-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/admin/businesses/members")}
            className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            멤버 목록으로 돌아가기
          </button>
          <div>
            {member.hasPickupRole ? (
              <button
                type="button"
                onClick={() => handlePickupRoleAction("revoke")}
                className="typo-medium-14 flex cursor-pointer items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-white transition-colors hover:bg-red-700"
              >
                픽업 권한 회수
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handlePickupRoleAction("grant")}
                className="typo-medium-14 flex cursor-pointer items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-white transition-colors hover:bg-amber-700"
              >
                픽업 권한 부여
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* 멤버 정보 */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">멤버 정보</h3>
                {member.hasPickupRole ? (
                  <Badge className="bg-amber-100 text-amber-700">
                    픽업 권한 있음
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-500">
                    픽업 권한 없음
                  </Badge>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 p-6 md:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">User ID</p>
                <p className="text-sm font-medium text-gray-900">
                  {member.userId}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">이름</p>
                <p className="text-sm font-medium text-gray-900">
                  {member.name ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">이메일</p>
                <p className="text-sm font-medium text-gray-900">
                  {member.username ?? "-"}
                </p>
              </div>
            </div>
          </div>

          {/* 사업자 정보 */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="font-bold text-gray-900">사업자 정보</h3>
            </div>
            <div className="grid grid-cols-2 gap-6 p-6 md:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">업체명</p>
                <p className="text-sm font-medium text-gray-900">
                  {member.businessName ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">사업자등록번호</p>
                <p className="text-sm font-medium text-gray-900">
                  {member.businessRegistrationNumber ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">연락처</p>
                <p className="text-sm font-medium text-gray-900">
                  {member.contact ?? "-"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">픽업 주소</p>
                <p className="text-sm font-medium text-gray-900">
                  {member.pickupAddress ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">사업자 등록일</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(member.businessCreatedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">사업자 수정일</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(member.businessUpdatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
