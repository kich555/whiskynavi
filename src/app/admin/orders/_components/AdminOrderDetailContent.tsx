"use client";

import type { AdminOrderResponse as OrderResponse } from "@/apis/generated/api";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/app/admin/constants";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { formatOrderClassification } from "@/lib/order-classification";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";

interface AdminOrderDetailContentProps {
  order: OrderResponse;
}

function getOrderSourceLabel(order: OrderResponse) {
  if (order.orderSource === "ADMIN_MANUAL") return "관리자 수동";
  if (order.orderSource === "CART") return "장바구니";
  if (order.orderSource === "SINGLE_ITEM") return "단건";
  if ((order.itemsCount ?? order.items?.length ?? 0) > 1) return "장바구니";
  return "단건";
}

function getOrderItemsSummary(order: OrderResponse) {
  return order.itemsSummary || order.itemName || order.saleTitle || "-";
}

function getOrderTotalQuantity(order: OrderResponse) {
  return (
    order.totalQuantity ??
    order.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ??
    order.requestedQuantity ??
    0
  );
}

function getOrderPriceSummary(order: OrderResponse) {
  return {
    discountAmount: order.priceSummary?.discountAmount,
    freeShippingApplied: order.priceSummary?.freeShippingApplied ?? order.freeShippingApplied,
    freeShippingRemainingAmount: order.priceSummary?.freeShippingRemainingAmount,
    freeShippingThreshold: order.priceSummary?.freeShippingThreshold ?? order.freeShippingThreshold,
    itemsTotalPrice: order.priceSummary?.itemsTotalPrice ?? order.itemsTotalPrice,
    shippingFee: order.priceSummary?.shippingFee ?? order.shippingFee,
    totalPrice: order.priceSummary?.totalPrice ?? order.totalPrice,
  };
}

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium break-words text-gray-900">{value ?? "-"}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default function AdminOrderDetailContent({ order }: AdminOrderDetailContentProps) {
  const router = useRouter();
  const { toggle } = useSidebar();
  const statusLabel = order.orderStatus ? (ORDER_STATUS_LABEL[order.orderStatus] ?? order.orderStatus) : "-";
  const statusColor = order.orderStatus
    ? (ORDER_STATUS_COLOR[order.orderStatus] ?? "bg-gray-100 text-gray-700")
    : "bg-gray-100 text-gray-700";
  const priceSummary = getOrderPriceSummary(order);
  const lineItems = order.items ?? [];
  const orderClassification = formatOrderClassification(order);

  return (
    <>
      <AdminHeader title="일반상품 주문 상세" onToggleSidebar={toggle} showSearch={false} />

      <div className="space-y-6 p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
            주문 목록으로 돌아가기
          </Button>
          <span className={`rounded-full px-3 py-1 text-sm ${statusColor}`}>{statusLabel}</span>
        </div>

        <Section title="주문 정보">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <DetailField label="주문번호" value={order.orderNumber} />
            <DetailField label="주문 ID" value={order.id} />
            <DetailField label="주문 생성 방식" value={getOrderSourceLabel(order)} />
            <DetailField label="주문 분류" value={orderClassification} />
            <DetailField label="주문일시" value={formatDateTime(order.createdAt)} />
            <DetailField label="상품 요약" value={getOrderItemsSummary(order)} />
            <DetailField label="상품 라인 수" value={order.itemsCount != null ? `${order.itemsCount}건` : undefined} />
            <DetailField label="총 수량" value={`총 수량 ${getOrderTotalQuantity(order)}개`} />
            <DetailField label="가능 액션" value={order.availableAdminActions?.join(", ")} />
            {order.orderNote && (
              <div className="md:col-span-2 xl:col-span-4">
                <DetailField label="주문 메모" value={order.orderNote} />
              </div>
            )}
          </div>
        </Section>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="고객 정보">
            <div className="grid gap-6 md:grid-cols-2">
              <DetailField label="고객명" value={order.customer?.name ?? order.delivery?.receiverName} />
              <DetailField label="회원 구분" value={order.customer?.guest ? "비회원" : "회원"} />
              <DetailField label="고객 연락처" value={order.customer?.phone ?? order.guestPhone} />
              <DetailField label="고객 이메일" value={order.customer?.email ?? order.guestEmail} />
              <DetailField label="사용자 ID" value={order.customer?.userId ?? order.userId} />
              <DetailField label="로그인 ID" value={order.customer?.username} />
            </div>
          </Section>

          <Section title="결제 정보">
            <div className="grid gap-6 md:grid-cols-2">
              <DetailField label="결제수단" value={order.payment?.paymentMethod} />
              <DetailField label="결제상태" value={order.payment?.paymentStatus} />
              <DetailField label="결제 금액" value={formatCurrency(order.payment?.paidAmount)} />
              <DetailField label="결제 완료일" value={formatDateTime(order.payment?.paidAt)} />
            </div>
          </Section>
        </div>

        <Section title="상품 라인">
          {lineItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left">상품명</th>
                    <th className="px-3 py-2 text-left">판매공고</th>
                    <th className="px-3 py-2 text-left">분류</th>
                    <th className="px-3 py-2 text-right">단가</th>
                    <th className="px-3 py-2 text-right">수량</th>
                    <th className="px-3 py-2 text-right">라인 합계</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineItems.map((item, index) => (
                    <tr key={item.orderItemId ?? `${item.productId ?? "item"}-${index}`}>
                      <td className="px-3 py-3 font-medium text-gray-900">{item.itemName ?? "-"}</td>
                      <td className="px-3 py-3 text-gray-600">{item.saleTitle ?? "-"}</td>
                      <td className="px-3 py-3 text-gray-600">{formatOrderClassification(item)}</td>
                      <td className="px-3 py-3 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-3 text-right text-gray-700">{item.quantity ?? 0}개</td>
                      <td className="px-3 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(item.lineTotalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-4">
              <DetailField label="상품명" value={order.itemName ?? order.saleTitle} />
              <DetailField label="분류" value={orderClassification} />
              <DetailField label="단가" value={formatCurrency(order.unitPrice)} />
              <DetailField label="수량" value={`${order.requestedQuantity ?? 0}개`} />
              <DetailField label="총액" value={formatCurrency(order.totalPrice)} />
            </div>
          )}
        </Section>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="배송 정보">
            <div className="grid gap-6 md:grid-cols-2">
              <DetailField label="수령인" value={order.delivery?.receiverName} />
              <DetailField label="수령인 연락처" value={order.delivery?.receiverPhone} />
              <div className="md:col-span-2">
                <DetailField label="주소" value={order.delivery?.address} />
              </div>
              <DetailField label="배송사" value={order.delivery?.carrierName} />
              <DetailField label="운송장번호" value={order.delivery?.trackingNumber} />
              <DetailField label="발송일" value={formatDateTime(order.delivery?.shippedAt)} />
              <DetailField label="배송 완료일" value={formatDateTime(order.delivery?.deliveredAt)} />
              <div className="md:col-span-2">
                <DetailField label="배송 메모" value={order.delivery?.deliveryMemo} />
              </div>
            </div>
          </Section>

          <Section title="금액 요약">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">상품 합계</span>
                <span className="font-medium text-gray-900">{formatCurrency(priceSummary.itemsTotalPrice)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">배송비</span>
                <span className="font-medium text-gray-900">{formatCurrency(priceSummary.shippingFee)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">할인</span>
                <span className="font-medium text-gray-900">{formatCurrency(priceSummary.discountAmount)}</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-gray-200 pt-3 text-base">
                <span className="font-bold text-gray-900">최종 금액</span>
                <span className="font-bold text-gray-900">{formatCurrency(priceSummary.totalPrice)}</span>
              </div>
              <div className="pt-2 text-xs text-gray-500">
                {priceSummary.freeShippingApplied ? "무료배송 적용" : "무료배송 미적용"}
                {priceSummary.freeShippingThreshold != null && (
                  <span> · 기준 {formatCurrency(priceSummary.freeShippingThreshold)}</span>
                )}
                {priceSummary.freeShippingRemainingAmount != null && (
                  <span> · 남은 금액 {formatCurrency(priceSummary.freeShippingRemainingAmount)}</span>
                )}
              </div>
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}
