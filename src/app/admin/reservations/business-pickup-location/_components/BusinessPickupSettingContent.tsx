"use client";

import type { BusinessReservationPickupSettingResponse } from "@/apis/generated/api";
import { formatDateTime } from "@/lib/formatters";
import { MapPin, RotateCcw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import AdminHeader from "../../../_components/AdminHeader";
import { useSidebar } from "../../../_components/AdminLayoutClient";
import { clearBusinessPickupSettingAction, updateBusinessPickupSettingAction } from "../actions";

export interface PickupBusinessOption {
  businessId: number;
  businessName: string;
  pickupAddress?: string;
  contact?: string;
}

const ASSIGNMENT_LABEL: Record<string, string> = {
  ADMIN_DESIGNATED: "관리자 지정 업장",
  APPLICANT_BUSINESS_FALLBACK: "신청 사업장 직접 픽업",
  USER_SELECTED: "사용자 선택",
};

interface BusinessPickupSettingContentProps {
  setting: BusinessReservationPickupSettingResponse;
  businesses: PickupBusinessOption[];
}

export default function BusinessPickupSettingContent({ setting, businesses }: BusinessPickupSettingContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [businessId, setBusinessId] = useState(setting.businessId ? String(setting.businessId) : "");
  const [reason, setReason] = useState("");
  const isDesignated = setting.assignmentType === "ADMIN_DESIGNATED";

  const handleUpdate = () => {
    startTransition(async () => {
      const result = await updateBusinessPickupSettingAction(Number(businessId), reason);
      if (!result.success) {
        toast.error(result.error ?? "픽업 업장 지정에 실패했습니다.");
        return;
      }
      setReason("");
      toast.success("비즈니스 예약 픽업 업장을 지정했습니다.");
      router.refresh();
    });
  };

  const handleClear = () => {
    startTransition(async () => {
      const result = await clearBusinessPickupSettingAction(reason);
      if (!result.success) {
        toast.error(result.error ?? "픽업 업장 해제에 실패했습니다.");
        return;
      }
      setBusinessId("");
      setReason("");
      toast.success("신청 사업장 직접 픽업 정책으로 변경했습니다.");
      router.refresh();
    });
  };

  return (
    <>
      <AdminHeader title="비즈니스 예약 픽업 설정" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        <div className="max-w-3xl space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                <MapPin size={20} />
              </div>
              <div>
                <p className="typo-medium-12 text-gray-500">현재 정책</p>
                <h2 className="typo-bold-20 mt-1 text-gray-900">
                  {ASSIGNMENT_LABEL[setting.assignmentType ?? ""] ?? "설정 확인 필요"}
                </h2>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
              <div>
                <dt className="typo-medium-12 text-gray-500">픽업 업장</dt>
                <dd className="typo-medium-14 mt-1 text-gray-900">
                  {isDesignated ? (setting.businessName ?? "-") : "각 신청 사업장"}
                </dd>
              </div>
              <div>
                <dt className="typo-medium-12 text-gray-500">주소</dt>
                <dd className="typo-medium-14 mt-1 text-gray-900">
                  {isDesignated ? (setting.pickupAddress ?? "-") : "신청 사업장 주소"}
                </dd>
              </div>
              <div>
                <dt className="typo-medium-12 text-gray-500">연락처</dt>
                <dd className="typo-medium-14 mt-1 text-gray-900">{isDesignated ? (setting.contact ?? "-") : "-"}</dd>
              </div>
              <div>
                <dt className="typo-medium-12 text-gray-500">최종 변경</dt>
                <dd className="typo-medium-14 mt-1 text-gray-900">{formatDateTime(setting.updatedAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="typo-bold-18 text-gray-900">정책 변경</h2>
            <p className="typo-medium-14 mt-2 text-gray-500">
              변경 내용은 신규 비즈니스 예약 신청부터 적용되며 기존 신청의 픽업 장소는 유지됩니다.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="pickup-business" className="typo-medium-14 mb-2 block text-gray-700">
                  지정할 픽업 업장
                </label>
                <select
                  id="pickup-business"
                  value={businessId}
                  onChange={(event) => setBusinessId(event.target.value)}
                  disabled={isPending}
                  className="typo-medium-14 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">업장을 선택해 주세요</option>
                  {businesses.map((business) => (
                    <option key={business.businessId} value={business.businessId}>
                      {business.businessName}
                      {business.pickupAddress ? ` · ${business.pickupAddress}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="change-reason" className="typo-medium-14 mb-2 block text-gray-700">
                  변경 사유
                </label>
                <textarea
                  id="change-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={500}
                  rows={4}
                  disabled={isPending}
                  placeholder="운영 이력에 남길 변경 사유를 입력해 주세요."
                  className="typo-medium-14 w-full resize-none rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="typo-medium-12 mt-1 text-right text-gray-400">{reason.length}/500</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isPending || !businessId || !reason.trim()}
                  className="typo-medium-14 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={16} />
                  {isPending ? "변경 중..." : "선택 업장으로 지정"}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isPending || !isDesignated || !reason.trim()}
                  className="typo-medium-14 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                  신청 사업장 직접 픽업으로 전환
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
