"use client";

import type { UserOrderResponse } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatOrderClassification } from "@/lib/order-classification";
import { overlay } from "overlay-kit";
import { getDeliveryProgressLabel } from "../../general-items/delivery-order/_lib/order-utils";
import { CANCELABLE_STATUSES } from "../_lib/constants";
import { formatCurrency, formatDate, getOrderStatusConfig } from "../_lib/utils";
import OrderCancelModal from "./OrderCancelModal";

interface OrderDetailModalProps {
  isOpen: boolean;
  close: () => void;
  order: UserOrderResponse;
}

export default function OrderDetailModal({ isOpen, close, order }: OrderDetailModalProps) {
  const status = getOrderStatusConfig(order.orderStatus);
  const canCancel = CANCELABLE_STATUSES.includes(order.orderStatus as never);
  const orderClassification = formatOrderClassification(order);

  const handleCancelClick = () => {
    overlay.open(({ isOpen: cancelOpen, close: cancelClose }) => (
      <OrderCancelModal
        isOpen={cancelOpen}
        close={cancelClose}
        orderId={order.id!}
        itemName={order.itemName || order.saleTitle}
      />
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>주문 상세</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* 주문 상태 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">주문번호: {order.orderNumber}</p>
              <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
            </div>
            <span className={`typo-bold-14 rounded px-3 py-1 ${status.colorClass}`}>{status.label}</span>
          </div>

          {/* 상품 정보 */}
          <div className="border-t pt-4">
            <h4 className="mb-3 font-bold text-gray-900">상품 정보</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">상품명</span>
                <span className="font-medium">{order.itemName || order.saleTitle || "상품명 없음"}</span>
              </div>
              <DetailRow label="주문 분류" value={orderClassification} />
              <div className="flex justify-between">
                <span className="text-gray-500">신청 수량</span>
                <span className="font-medium">{order.requestedQuantity}병</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">배정 수량</span>
                <span className="font-medium">{order.approvedQuantity}병</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">단가</span>
                <span className="font-medium">{formatCurrency(order.unitPrice)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold text-gray-900">총 금액</span>
                <span className="font-bold text-gray-900">{formatCurrency(order.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* 결제 정보 */}
          {order.payment && (
            <div className="border-t pt-4">
              <h4 className="mb-3 font-bold text-gray-900">결제 정보</h4>
              <div className="space-y-2 text-sm">
                <DetailRow label="결제수단" value={order.payment.paymentMethod} />
                <DetailRow label="결제상태" value={order.payment.paymentStatus} />
                <DetailRow label="결제금액" value={formatCurrency(order.payment.paidAmount)} />
                {order.payment.paidAt && <DetailRow label="결제일" value={formatDate(order.payment.paidAt)} />}
              </div>
            </div>
          )}

          {/* 배송 정보 */}
          {order.delivery && (
            <div className="border-t pt-4">
              <h4 className="mb-3 font-bold text-gray-900">배송 정보</h4>
              <div className="space-y-2 text-sm">
                <DetailRow label="배송 진행" value={getDeliveryProgressLabel(order.orderStatus, order.delivery)} />
                <DetailRow label="수령인" value={order.delivery.receiverName} />
                <DetailRow label="연락처" value={order.delivery.receiverPhone} />
                <DetailRow label="주소" value={order.delivery.address} />
                <DetailRow label="배송 메모" value={order.delivery.deliveryMemo} />
                <DetailRow label="배송사" value={order.delivery.carrierName || "CJ대한통운"} />
                <DetailRow label="운송장번호" value={order.delivery.trackingNumber || "배송 준비 중"} />
                {order.delivery.shippedAt && <DetailRow label="발송일" value={formatDate(order.delivery.shippedAt)} />}
                {order.delivery.deliveredAt && (
                  <DetailRow label="배송완료일" value={formatDate(order.delivery.deliveredAt)} />
                )}
              </div>
            </div>
          )}

          {/* 취소 사유 */}
          {order.cancelReason && (
            <div className="border-t pt-4">
              <h4 className="mb-2 font-bold text-gray-900">취소 사유</h4>
              <p className="text-sm text-gray-600">{order.cancelReason}</p>
            </div>
          )}

          {/* 취소 버튼 */}
          {canCancel && (
            <div className="border-t pt-4">
              <Button variant="destructive" onClick={handleCancelClick}>
                주문 취소
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span className="text-right font-medium break-words text-gray-900">{value || "-"}</span>
    </div>
  );
}
