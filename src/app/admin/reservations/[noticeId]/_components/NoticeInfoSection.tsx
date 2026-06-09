"use client";

import type { AdminBottleReservationNoticeResponse } from "@/apis/generated/api";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import type { ReactNode } from "react";
import { ROLE_LABEL_MAP } from "../../../constants";
import NoticeStatusBadge from "../../_components/NoticeStatusBadge";

interface NoticeInfoSectionProps {
  notice: AdminBottleReservationNoticeResponse;
}

export default function NoticeInfoSection({ notice }: NoticeInfoSectionProps) {
  const fields: { label: string; value: ReactNode }[] = [
    { label: "공고 ID", value: notice.id },
    { label: "제품명", value: notice.bottleName },
    { label: "브랜드", value: notice.bottleBrand ?? "-" },
    { label: "상태", value: <NoticeStatusBadge notice={notice} /> },
    {
      label: "가격",
      value: formatCurrency(notice.price),
    },
    { label: "예약 시작", value: formatDateTime(notice.reservationStartAt) },
    { label: "예약 종료", value: formatDateTime(notice.reservationEndAt) },
    { label: "예약 받을 병수", value: notice.availableQuantity ?? "-" },
    { label: "인당 최대 예약", value: notice.maxOrderQuantity ?? "-" },
    { label: "생성일", value: formatDateTime(notice.createdAt) },
  ];

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 font-bold text-gray-900">공고 정보</h3>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {fields.map((field) => (
          <div key={field.label}>
            <span className="mb-1 block text-xs text-gray-500">{field.label}</span>
            <span className="typo-medium-14 text-gray-900">{field.value}</span>
          </div>
        ))}
      </div>

      {notice.gradeConditions && notice.gradeConditions.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <span className="mb-2 block text-xs text-gray-500">등급 조건</span>
          <div className="flex flex-wrap gap-2">
            {notice.gradeConditions.map((gc, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700"
              >
                {ROLE_LABEL_MAP[gc.requiredRole as keyof typeof ROLE_LABEL_MAP] ?? gc.requiredRole}
                {gc.applicableFrom && <span className="text-amber-500">({formatDateTime(gc.applicableFrom)}~)</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
