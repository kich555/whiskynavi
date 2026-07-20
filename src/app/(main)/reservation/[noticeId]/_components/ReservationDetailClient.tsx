"use client";

import type {
  PickupLocationResponse,
  UserBottleReservationApplicationPublicResponse,
  UserBottleReservationNoticePublicResponse,
} from "@/apis/generated/api";
import RichTextContent from "@/components/editor/RichTextContent";
import RepresentativeImageCarousel from "@/components/media/RepresentativeImageCarousel";
import { hasBusinessRole } from "@/lib/auth";
import { sanitizeRichTextContent } from "@/lib/rich-text";
import { useSession } from "next-auth/react";
import { overlay } from "overlay-kit";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import ApplyForm from "../../_components/ApplyForm";
import InfoList from "../../_components/InfoList";
import StatusBadge from "../../_components/StatusBadge";
import TimerDisplay from "../../_components/TimerDisplay";
import { useCountdownTimer } from "../../_lib/useCountdownTimer";
import { applyReservation, cancelReservation, updateReservation } from "../../actions";
import CancelReservationModal from "./CancelReservationModal";

interface ReservationDetailClientProps {
  notice: UserBottleReservationNoticePublicResponse;
  pickupLocations: PickupLocationResponse[];
  myApplication: UserBottleReservationApplicationPublicResponse | null;
}

export default function ReservationDetailClient({
  notice,
  pickupLocations,
  myApplication: initialMyApplication,
}: ReservationDetailClientProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [myApplication, setMyApplication] = useState(initialMyApplication);
  const [isEditing, setIsEditing] = useState(false);
  const { data: session } = useSession();
  const isBusinessUser = hasBusinessRole(session?.user.roles);
  const { timeRemaining, status } = useCountdownTimer(notice);
  const isApplied = myApplication !== null;
  const isEditable = myApplication?.status === "APPLIED";
  const displayStatus = status === "closed" ? status : isApplied ? "applied" : status;

  const handleApply = (quantity: number, userBusinessId: number) => {
    setError(null);
    startTransition(async () => {
      const result = await applyReservation(notice.id!, quantity, userBusinessId);
      if (result.success) {
        // 예약 API가 정상 처리되면 같은 상세 화면에서 신청 완료 상태를 즉시 보여준다.
        setMyApplication(result.application ?? null);
      } else {
        setError(result.error ?? "예약 신청에 실패했습니다.");
      }
    });
  };

  const handleUpdate = (quantity: number, userBusinessId: number) => {
    if (!myApplication?.id) return;
    setError(null);
    startTransition(async () => {
      const result = await updateReservation(notice.id!, myApplication.id!, quantity, userBusinessId);
      if (result.success) {
        setMyApplication(result.application ?? myApplication);
        setIsEditing(false);
        toast.success("수정되었습니다");
      } else {
        setError(result.error ?? "예약 신청 수정에 실패했습니다.");
      }
    });
  };

  const handleCancel = async () => {
    if (!myApplication?.id) return;
    const result = await cancelReservation(notice.id!, myApplication.id!);
    if (result.success) {
      setMyApplication(null);
      setIsEditing(false);
      toast.success("취소되었습니다");
    } else {
      toast.error(result.error ?? "예약 신청 취소에 실패했습니다.");
    }
  };

  const openCancelModal = () => {
    overlay.open(({ isOpen, close }) => (
      <CancelReservationModal
        isOpen={isOpen}
        close={close}
        onConfirm={async () => {
          await handleCancel();
          close();
        }}
      />
    ));
  };

  return (
    <div className="border border-white/10 bg-white/5 p-4 lg:p-8">
      {/* Top: Image + Info */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:mb-8 lg:grid-cols-2 lg:gap-8">
        {/* Image */}
        <RepresentativeImageCarousel
          images={[notice.bottleImgUrl, ...(notice.imageUrls ?? [])]}
          alt={notice.bottleName ?? "예약 보틀"}
          surfaceClassName="bg-gradient-to-br from-gray-700 to-gray-800"
          imageClassName="p-6"
        >
          <StatusBadge status={displayStatus} className="absolute top-2 right-2 lg:top-4 lg:right-4" />
        </RepresentativeImageCarousel>

        {/* Info */}
        <div className="flex flex-col justify-center">
          <h3 className="typo-bold-20 mb-4 text-white lg:mb-6 lg:text-3xl">
            <span className="block">{notice.noticeName ?? "-"}</span>
            <span className="typo-medium-14 mt-2 block text-gray-400 lg:text-base">{notice.bottleName ?? "-"}</span>
          </h3>
          <InfoList notice={notice} hideAvailableQuantity={status === "closed"} hasBusinessRole={isBusinessUser} />
        </div>
      </div>

      {/* Bottom: Timer + Action */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <TimerDisplay
          status={displayStatus}
          timeRemaining={timeRemaining}
          reservationStartAt={notice.reservationStartAt}
          reservationEndAt={notice.reservationEndAt}
        />

        <div className="flex flex-col">
          {displayStatus === "active" ? (
            <ApplyForm
              onApply={handleApply}
              isPending={isPending}
              error={error}
              pickupLocations={pickupLocations}
              maxQuantity={notice.maxOrderQuantity}
            />
          ) : displayStatus === "pending" ? (
            <button
              type="button"
              disabled
              className="typo-bold-16 w-full cursor-not-allowed bg-gray-600 px-4 py-2.5 text-gray-400 transition-colors lg:px-6 lg:py-4 lg:text-xl"
            >
              예약 대기 중
            </button>
          ) : displayStatus === "applied" && isEditing ? (
            <ApplyForm
              mode="edit"
              onApply={handleUpdate}
              onCancelEdit={() => setIsEditing(false)}
              isPending={isPending}
              error={error}
              pickupLocations={pickupLocations}
              initialQuantity={myApplication?.quantity}
              initialLocationId={myApplication?.pickupUserBusinessId}
              maxQuantity={notice.maxOrderQuantity}
            />
          ) : displayStatus === "applied" ? (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled
                className="typo-bold-16 w-full cursor-not-allowed bg-green-600 px-4 py-2.5 text-white transition-colors lg:px-6 lg:py-4 lg:text-xl"
              >
                예약신청완료
              </button>
              {isEditable && (
                <>
                  <p className="typo-medium-14 text-gray-300">
                    {myApplication?.quantity}병 ·{" "}
                    {myApplication?.pickupBusinessName ??
                      pickupLocations.find((loc) => loc.id === myApplication?.pickupUserBusinessId)?.businessName ??
                      "-"}
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      disabled={isPending}
                      className="typo-bold-16 flex-1 border border-white/20 px-4 py-2.5 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 lg:px-6 lg:text-xl"
                    >
                      수정하기
                    </button>
                    <button
                      type="button"
                      onClick={openCancelModal}
                      disabled={isPending}
                      className="typo-bold-16 flex-1 border border-red-500/40 px-4 py-2.5 text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 lg:px-6 lg:text-xl"
                    >
                      취소하기
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {notice.description && (
        <RichTextContent
          html={sanitizeRichTextContent(notice.description)}
          className="typo-medium-14 mt-6 overflow-y-auto text-gray-300 lg:mt-8 lg:text-base [&_a]:text-amber-300 [&_a]:underline"
        />
      )}
    </div>
  );
}
