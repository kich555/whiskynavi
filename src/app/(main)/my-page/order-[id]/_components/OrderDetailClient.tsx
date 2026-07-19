"use client";

import type { UserOrderResponse } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { formatOrderClassification } from "@/lib/order-classification";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { overlay } from "overlay-kit";
import { getDeliveryProgressLabel } from "../../../general-items/delivery-order/_lib/order-utils";
import OrderCancelModal from "../../_components/OrderCancelModal";
import { CANCELABLE_STATUSES } from "../../_lib/constants";
import { formatCurrency, formatDate, getOrderStatusConfig } from "../../_lib/utils";

interface OrderDetailClientProps {
  order: UserOrderResponse;
}

export default function OrderDetailClient({ order }: OrderDetailClientProps) {
  const status = getOrderStatusConfig(order.orderStatus);
  const canCancel = CANCELABLE_STATUSES.includes(order.orderStatus as never);
  const orderClassification = formatOrderClassification(order);

  const handleCancelClick = () => {
    overlay.open(({ isOpen, close }) => (
      <OrderCancelModal
        isOpen={isOpen}
        close={close}
        orderId={order.id!}
        itemName={order.itemName || order.saleTitle}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-[#1d2429] pt-10 pb-12 sm:pt-24">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-10">
        {/* Back Button & Header */}
        <div className="mb-3 sm:mb-6">
          <Link
            href="/my-page?tab=orders"
            className="group mb-2 flex items-center gap-2 text-white/70 transition-colors hover:text-white sm:mb-4"
          >
            <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
            <span className="font-semibold">돌아가기</span>
          </Link>
          <h1 className="typo-bold-24 mb-2 text-white sm:text-3xl">주문 상세</h1>
          <p className="typo-medium-14 text-gray-400 sm:text-base">주문번호: {order.orderNumber}</p>
        </div>

        {/* Order Status */}
        <div className={`mb-4 border p-4 sm:mb-6 sm:p-6 ${status.colorClass}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="typo-bold-20 mb-1 sm:text-2xl">{status.label}</p>
              <p className="typo-medium-14 text-white/60">{formatDate(order.createdAt)}</p>
            </div>
            {canCancel && (
              <Button variant="destructive" onClick={handleCancelClick}>
                주문 취소
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="border border-white/10 bg-white/5 p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.8fr_1fr] lg:gap-12">
            {/* 상품 정보 */}
            <div>
              <h3 className="typo-bold-18 mb-4 border-b border-white/20 pb-3 text-white sm:mb-6 sm:pb-4 sm:text-xl lg:text-2xl">
                상품 정보
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <InfoRow label="상품명" value={order.itemName || order.saleTitle || "상품명 없음"} />
                <InfoRow label="신청 수량" value={`${order.requestedQuantity ?? 0}병`} />
                <InfoRow label="배정 수량" value={`${order.approvedQuantity ?? 0}병`} />
                <InfoRow label="단가" value={formatCurrency(order.unitPrice)} />
                <InfoRow label="총 금액" value={formatCurrency(order.totalPrice)} bold />
              </div>
            </div>

            {/* 주문 정보 */}
            <div>
              <h3 className="typo-bold-18 mb-4 border-b border-white/20 pb-3 text-white sm:mb-6 sm:pb-4 sm:text-xl lg:text-2xl">
                주문 정보
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <InfoRow label="주문일시" value={formatDate(order.createdAt)} />
                <InfoRow label="주문 분류" value={orderClassification} />
                {order.orderNote && <InfoRow label="주문 메모" value={order.orderNote} />}
                {order.cancelReason && <InfoRow label="취소 사유" value={order.cancelReason} />}
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 border-t border-white/10 pt-8 lg:grid-cols-2 lg:gap-12">
            {order.payment && (
              <div>
                <h3 className="typo-bold-18 mb-4 border-b border-white/20 pb-3 text-white sm:mb-6 sm:pb-4 sm:text-xl lg:text-2xl">
                  결제 정보
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <InfoRow label="결제수단" value={order.payment.paymentMethod ?? "-"} />
                  <InfoRow label="결제상태" value={order.payment.paymentStatus ?? "-"} />
                  <InfoRow label="결제금액" value={formatCurrency(order.payment.paidAmount)} />
                  {order.payment.paidAt && <InfoRow label="결제일" value={formatDate(order.payment.paidAt)} />}
                </div>
              </div>
            )}

            {order.delivery && (
              <div>
                <h3 className="typo-bold-18 mb-4 border-b border-white/20 pb-3 text-white sm:mb-6 sm:pb-4 sm:text-xl lg:text-2xl">
                  배송 정보
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <InfoRow label="배송 진행" value={getDeliveryProgressLabel(order.orderStatus, order.delivery)} />
                  <InfoRow label="수령인" value={order.delivery.receiverName ?? "-"} />
                  <InfoRow label="연락처" value={order.delivery.receiverPhone ?? "-"} />
                  <InfoRow label="주소" value={order.delivery.address ?? "-"} />
                  <InfoRow label="배송 메모" value={order.delivery.deliveryMemo ?? "-"} />
                  <InfoRow label="배송사" value={order.delivery.carrierName || "CJ대한통운"} />
                  <InfoRow label="운송장번호" value={order.delivery.trackingNumber || "배송 준비 중"} />
                  {order.delivery.shippedAt && <InfoRow label="발송일" value={formatDate(order.delivery.shippedAt)} />}
                  {order.delivery.deliveredAt && (
                    <InfoRow label="배송완료일" value={formatDate(order.delivery.deliveredAt)} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-2.5 sm:pb-3">
      <span className="typo-medium-12 text-gray-400 sm:typo-medium-14 lg:text-base">{label}</span>
      <span className={`typo-medium-12 sm:typo-medium-14 lg:text-base ${bold ? "typo-bold-12" : "typo-medium-12"} text-white`}>
        {value}
      </span>
    </div>
  );
}
