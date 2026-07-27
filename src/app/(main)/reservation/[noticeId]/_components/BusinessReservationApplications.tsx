"use client";

import type { BusinessBottleReservationApplicationPublicResponse } from "@/apis/generated/api";
import { overlay } from "overlay-kit";
import { type Dispatch, type SetStateAction, useState, useTransition } from "react";
import { toast } from "sonner";
import BusinessApplyForm, { type ReservationBusinessOption } from "../../_components/BusinessApplyForm";
import type { NoticeStatus } from "../../_lib/utils";
import { applyBusinessReservation, cancelBusinessReservation, updateBusinessReservation } from "../../actions";
import CancelReservationModal from "./CancelReservationModal";

export type ReservationBusinessApplication = Pick<
  BusinessBottleReservationApplicationPublicResponse,
  | "id"
  | "businessId"
  | "businessName"
  | "quantity"
  | "confirmedQuantity"
  | "pickupBusinessName"
  | "pickupAddress"
  | "status"
>;

interface BusinessReservationApplicationsProps {
  noticeId: number;
  status: NoticeStatus;
  businessOptions: ReservationBusinessOption[];
  applications: ReservationBusinessApplication[];
  onApplicationsChange: Dispatch<SetStateAction<ReservationBusinessApplication[]>>;
  initialSelectedBusinessId?: number;
  maxQuantity?: number;
}

const APPLICATION_STATUS_LABEL: Record<ReservationBusinessApplication["status"], string> = {
  APPLIED: "신청 완료",
  CANCELLED: "취소",
  CONFIRMED: "확정",
  PAYMENT_COMPLETED: "결제 완료",
  WAITING_PICKUP: "픽업 대기",
  RECEIVED: "수령 완료",
  REJECTED: "반려",
};

export default function BusinessReservationApplications({
  noticeId,
  status,
  businessOptions,
  applications,
  onApplicationsChange,
  initialSelectedBusinessId,
  maxQuantity,
}: BusinessReservationApplicationsProps) {
  const [requestedBusinessId, setRequestedBusinessId] = useState(initialSelectedBusinessId);
  const [editingApplicationId, setEditingApplicationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const appliedBusinessIds = new Set(applications.map((application) => application.businessId));
  const availableBusinessOptions = businessOptions.filter((business) => !appliedBusinessIds.has(business.businessId));
  const selectedBusinessId = availableBusinessOptions.some((business) => business.businessId === requestedBusinessId)
    ? requestedBusinessId
    : availableBusinessOptions[0]?.businessId;
  const canEdit = status === "active";

  const handleApply = (quantity: number) => {
    if (!selectedBusinessId) return;
    setError(null);
    startTransition(async () => {
      const result = await applyBusinessReservation(noticeId, selectedBusinessId, quantity);
      if (result.success && result.application) {
        const newApplication = result.application;
        onApplicationsChange((current) => [
          newApplication,
          ...current.filter((application) => application.businessId !== selectedBusinessId),
        ]);
        toast.success("신청되었습니다");
      } else {
        setError(result.error ?? "비즈니스 예약 신청에 실패했습니다.");
      }
    });
  };

  const handleUpdate = (application: ReservationBusinessApplication, quantity: number) => {
    setError(null);
    startTransition(async () => {
      const result = await updateBusinessReservation(noticeId, application.businessId, application.id, quantity);
      if (result.success && result.application) {
        const updatedApplication = result.application;
        onApplicationsChange((current) =>
          current.map((item) => (item.id === application.id ? updatedApplication : item)),
        );
        setEditingApplicationId(null);
        toast.success("수정되었습니다");
      } else {
        setError(result.error ?? "비즈니스 예약 신청 수정에 실패했습니다.");
      }
    });
  };

  const handleCancel = async (application: ReservationBusinessApplication) => {
    const result = await cancelBusinessReservation(noticeId, application.businessId, application.id);
    if (result.success) {
      onApplicationsChange((current) => current.filter((item) => item.id !== application.id));
      setRequestedBusinessId(application.businessId);
      setEditingApplicationId(null);
      toast.success("취소되었습니다");
    } else {
      toast.error(result.error ?? "예약 신청 취소에 실패했습니다.");
    }
  };

  const openCancelModal = (application: ReservationBusinessApplication) => {
    overlay.open(({ isOpen, close }) => (
      <CancelReservationModal
        isOpen={isOpen}
        close={close}
        onConfirm={async () => {
          await handleCancel(application);
          close();
        }}
      />
    ));
  };

  return (
    <div className="space-y-5">
      <section aria-labelledby="business-application-list-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h4 id="business-application-list-heading" className="typo-bold-16 text-white lg:text-xl">
            사업장별 신청 내역
          </h4>
          <span className="typo-medium-12 text-gray-400">{applications.length}건</span>
        </div>

        {applications.length > 0 ? (
          <ul className="space-y-3">
            {applications.map((application) => {
              const isEditing = editingApplicationId === application.id;
              const isEditableApplication = canEdit && application.status === "APPLIED";

              return (
                <li key={application.id} className="border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <strong className="typo-bold-16 text-white">{application.businessName}</strong>
                    <span className="typo-medium-12 bg-white/10 px-2 py-1 text-gray-200">
                      {APPLICATION_STATUS_LABEL[application.status]}
                    </span>
                  </div>

                  <dl className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <dt className="typo-medium-12 text-gray-400">신청 수량</dt>
                      <dd className="typo-medium-14 mt-1 text-white">{application.quantity}병</dd>
                    </div>
                    <div>
                      <dt className="typo-medium-12 text-gray-400">확정 수량</dt>
                      <dd className="typo-medium-14 mt-1 text-white">
                        {application.confirmedQuantity == null ? "-" : `${application.confirmedQuantity}병`}
                      </dd>
                    </div>
                    <div>
                      <dt className="typo-medium-12 text-gray-400">픽업 장소</dt>
                      <dd className="typo-medium-14 mt-1 text-white">
                        <span className="block">{application.pickupBusinessName || "-"}</span>
                        {application.pickupAddress ? (
                          <span className="typo-medium-12 mt-1 block text-gray-400">{application.pickupAddress}</span>
                        ) : null}
                      </dd>
                    </div>
                  </dl>

                  {isEditing && isEditableApplication ? (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <BusinessApplyForm
                        mode="edit"
                        businesses={businessOptions}
                        selectedBusinessId={application.businessId}
                        onBusinessChange={() => undefined}
                        onApply={(quantity) => handleUpdate(application, quantity)}
                        onCancelEdit={() => {
                          setEditingApplicationId(null);
                          setError(null);
                        }}
                        isPending={isPending}
                        error={error}
                        initialQuantity={application.quantity}
                        maxQuantity={maxQuantity}
                        showBusinessSelector={false}
                      />
                    </div>
                  ) : isEditableApplication ? (
                    <div className="mt-4 flex gap-3 border-t border-white/10 pt-4">
                      <button
                        type="button"
                        aria-label={`${application.businessName} 신청 수정`}
                        onClick={() => {
                          setEditingApplicationId(application.id);
                          setError(null);
                        }}
                        disabled={isPending}
                        className="typo-bold-14 flex-1 border border-white/20 px-4 py-2.5 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        수정하기
                      </button>
                      <button
                        type="button"
                        aria-label={`${application.businessName} 신청 취소`}
                        onClick={() => openCancelModal(application)}
                        disabled={isPending}
                        className="typo-bold-14 flex-1 border border-red-500/40 px-4 py-2.5 text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        취소하기
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="typo-medium-14 border border-dashed border-white/15 px-4 py-6 text-center text-gray-400">
            신청한 사업장이 없습니다.
          </p>
        )}
      </section>

      {status === "active" && availableBusinessOptions.length > 0 ? (
        <section aria-labelledby="business-additional-application-heading" className="border-t border-white/10 pt-5">
          <h4 id="business-additional-application-heading" className="typo-bold-16 mb-3 text-white lg:text-xl">
            사업장 추가 신청
          </h4>
          <BusinessApplyForm
            businesses={availableBusinessOptions}
            selectedBusinessId={selectedBusinessId}
            onBusinessChange={setRequestedBusinessId}
            onApply={handleApply}
            isPending={isPending}
            error={error}
            maxQuantity={maxQuantity}
          />
        </section>
      ) : status === "active" && businessOptions.length > 0 ? (
        <p className="typo-medium-14 border border-green-500/20 bg-green-500/10 px-4 py-3 text-green-200">
          모든 관리 사업장에서 신청을 완료했습니다.
        </p>
      ) : status === "pending" ? (
        <button
          type="button"
          disabled
          className="typo-bold-16 w-full cursor-not-allowed bg-gray-600 px-4 py-2.5 text-gray-400"
        >
          예약 대기 중
        </button>
      ) : null}
    </div>
  );
}
