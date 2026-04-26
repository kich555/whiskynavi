"use client";

import type { BottleReservationPickupApplicationResponse } from "@/apis/generated/api";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import BusinessHeader from "../../../_components/BusinessHeader";
import {
  PICKUP_STATUS_COLOR,
  PICKUP_STATUS_LABEL,
} from "../../../constants";

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

interface PickupApplicationDetailContentProps {
  application: BottleReservationPickupApplicationResponse;
}

export default function PickupApplicationDetailContent({
  application,
}: PickupApplicationDetailContentProps) {
  const router = useRouter();

  return (
    <>
      <BusinessHeader title="픽업 예약 상세" />

      <div className="p-6">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push("/business/pickup-reservations")}
            className="flex cursor-pointer items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            픽업 예약 목록으로 돌아가기
          </button>
        </div>

        <div className="space-y-4">
          {/* 병 정보 */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="font-bold text-gray-900">병 정보</h3>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-6">
                {application.bottleImgUrl && (
                  <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-gray-200">
                    <Image
                      src={application.bottleImgUrl}
                      alt={application.bottleName ?? "병 이미지"}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">신청 ID</p>
                    <p className="text-sm font-medium text-gray-900">
                      {application.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">공고 ID</p>
                    <p className="text-sm font-medium text-gray-900">
                      {application.noticeId ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">병 이름</p>
                    <p className="text-sm font-medium text-gray-900">
                      {application.bottleName ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">병 ID</p>
                    <p className="text-sm font-medium text-gray-900">
                      {application.bottleId ?? "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 신청 정보 */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="font-bold text-gray-900">신청 정보</h3>
            </div>
            <div className="grid grid-cols-2 gap-6 p-6 md:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">상태</p>
                <div className="mt-1">
                  <Badge
                    className={
                      PICKUP_STATUS_COLOR[application.status ?? ""] ??
                      "bg-gray-100 text-gray-700"
                    }
                  >
                    {PICKUP_STATUS_LABEL[application.status ?? ""] ??
                      application.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">신청수량</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.quantity ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">확정수량</p>
                <p className="text-sm font-medium text-amber-600">
                  {application.confirmedQuantity ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">신청일</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(application.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">수정일</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(application.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* 신청자 정보 */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="font-bold text-gray-900">신청자 정보</h3>
            </div>
            <div className="grid grid-cols-2 gap-6 p-6 md:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">이름</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.applicantUser?.name ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">닉네임</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.applicantUser?.nickname ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">이메일</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.applicantUser?.email ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">전화번호</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.applicantUser?.phone ?? "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
