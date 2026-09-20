"use client";
import type { AdminServiceEntitlementResponse } from "@/apis/generated/api";
import ServiceEntitlementList from "@/components/orders/ServiceEntitlementList";
import ServiceEntitlementUseForm from "./ServiceEntitlementUseForm";

export default function ServiceEntitlementAdminPanel({
  orderId,
  rows,
}: {
  orderId: number;
  rows: AdminServiceEntitlementResponse[];
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 text-gray-900">
      <p className="typo-medium-14 mb-4 leading-6">
        관리자는 이용 시작 전이나 만료 후에도 사용 완료 처리할 수 있습니다. 실제 입장 또는 서비스 제공을 확인하고 사유를
        입력해 주세요. 사용 처리는 되돌릴 수 없으며 처리자와 사유가 기록됩니다.
      </p>
      <ServiceEntitlementList
        rows={rows}
        renderAction={(row) =>
          ["AVAILABLE", "NOT_YET_VALID", "EXPIRED"].includes(row.status ?? "") && row.id != null ? (
            <ServiceEntitlementUseForm key={row.id} orderId={orderId} entitlementId={row.id} />
          ) : null
        }
      />
    </section>
  );
}
