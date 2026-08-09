"use client";

import {
  AdminManualPurchaseBulkStatusUpdateRequestOrderStatus,
  type AdminBottleManualPurchaseV2Response,
} from "@/apis/generated/api";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/app/admin/constants";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateManualPurchaseStatusesAction } from "../../actions";

const STATUS_OPTIONS = [
  AdminManualPurchaseBulkStatusUpdateRequestOrderStatus.PAYMENT_COMPLETED,
  AdminManualPurchaseBulkStatusUpdateRequestOrderStatus.RECEIPT_PENDING,
  AdminManualPurchaseBulkStatusUpdateRequestOrderStatus.RECEIPT_COMPLETED,
] as const;

interface ManualPurchaseOrdersSectionProps {
  bottleId: number;
  purchases: AdminBottleManualPurchaseV2Response[];
}

export default function ManualPurchaseOrdersSection({ bottleId, purchases }: ManualPurchaseOrdersSectionProps) {
  const router = useRouter();
  const [targetStatus, setTargetStatus] = useState<AdminManualPurchaseBulkStatusUpdateRequestOrderStatus>(
    AdminManualPurchaseBulkStatusUpdateRequestOrderStatus.RECEIPT_PENDING,
  );
  const [isPending, startTransition] = useTransition();

  const updateStatuses = () => {
    if (
      !window.confirm(
        "현재 필터와 페이지에 관계없이 이 보틀의 관리자 수동 등록 주문 전체 상태를 변경합니다. 계속하시겠습니까?",
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await updateManualPurchaseStatusesAction(bottleId, targetStatus);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`${result.updatedCount}건의 상태를 변경했습니다.`);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3">
        <p className="typo-medium-12 text-amber-900">
          현재 필터·페이지와 관계없이 이 보틀의 관리자 수동 등록 주문 전체에 적용됩니다.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="변경할 주문 상태"
            value={targetStatus}
            onChange={(event) =>
              setTargetStatus(event.target.value as AdminManualPurchaseBulkStatusUpdateRequestOrderStatus)
            }
            disabled={isPending}
            className="typo-medium-14 h-10 rounded-lg border border-gray-300 bg-white px-3 text-gray-800 outline-none focus:border-amber-500"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={updateStatuses}
            disabled={isPending}
            className="typo-bold-14 h-10 rounded-lg bg-amber-600 px-4 text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isPending ? "변경 중..." : "이 보틀 전체 상태 변경"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[1080px] border-collapse">
          <thead className="bg-gray-50">
            <tr className="typo-bold-12 text-left text-gray-600">
              <th className="px-4 py-3">주문번호</th>
              <th className="px-4 py-3">구매자</th>
              <th className="px-4 py-3 text-right">수량</th>
              <th className="px-4 py-3 text-right">단가</th>
              <th className="px-4 py-3 text-right">총액</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">주문일</th>
              <th className="px-4 py-3">메모</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={8} className="typo-medium-14 px-4 py-10 text-center text-gray-500">
                  이 보틀에 관리자가 수동 등록한 구매내역이 없습니다.
                </td>
              </tr>
            ) : (
              purchases.map((purchase) => {
                const orderId = purchase.id;
                return (
                  <tr key={orderId} className="typo-medium-14 text-gray-700">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bottle-orders/${orderId}`}
                        className="font-semibold text-amber-700 hover:underline"
                      >
                        {purchase.orderNumber ?? `#${orderId}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>{purchase.memberName ?? "-"}</div>
                      <div className="typo-medium-12 mt-1 text-gray-500">{purchase.userPhone ?? "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{(purchase.quantity ?? 0).toLocaleString("ko-KR")}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(purchase.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(purchase.totalPrice)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`typo-bold-12 inline-flex rounded-full px-2.5 py-1 ${
                          ORDER_STATUS_COLOR[purchase.orderStatus ?? ""] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {ORDER_STATUS_LABEL[purchase.orderStatus ?? ""] ?? purchase.orderStatus ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(purchase.createdAt)}</td>
                    <td className="max-w-60 truncate px-4 py-3" title={purchase.orderNote}>
                      {purchase.orderNote ?? "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
