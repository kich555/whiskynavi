"use client";

import type { UserOrderResponse } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatOrderClassification } from "@/lib/order-classification";
import Link from "next/link";
import { overlay } from "overlay-kit";
import { getDeliveryProgressLabel } from "../../general-items/delivery-order/_lib/order-utils";
import { isOrderCancellationAllowed, isReceiptCompletionAllowed } from "../_lib/constants";
import { getOrderDisplayNames } from "../_lib/order-display";
import { formatCurrency, formatDate, getOrderStatusConfig } from "../_lib/utils";
import OrderCancelModal from "./OrderCancelModal";
import ReceiptCompleteButton from "./ReceiptCompleteButton";

interface OrderDetailModalProps {
  isOpen: boolean;
  close: () => void;
  order: UserOrderResponse;
}

export default function OrderDetailModal({ isOpen, close, order }: OrderDetailModalProps) {
  const status = getOrderStatusConfig(order.orderStatus);
  const canCancel = isOrderCancellationAllowed(order.orderStatus, order.saleTiming);
  const canCompleteReceipt =
    isReceiptCompletionAllowed(order.orderStatus, order.fulfillmentMethod) && order.id !== undefined;
  const orderClassification = formatOrderClassification(order);
  const displayNames = getOrderDisplayNames(order);

  const handleCancelClick = () => {
    overlay.open(({ isOpen: cancelOpen, close: cancelClose }) => (
      <OrderCancelModal
        isOpen={cancelOpen}
        close={cancelClose}
        orderId={order.id!}
        itemName={displayNames.primaryName}
      />
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-2xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>주문 상세</DialogTitle>
          <DialogDescription className="sr-only">주문 상품과 결제/배송 정보를 확인합니다.</DialogDescription>
        </DialogHeader>
        <div
          className="min-h-0 space-y-6 overflow-y-auto overscroll-contain py-4 pr-1"
          data-testid="order-detail-scroll-area"
        >
          {/* 주문 상태 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="typo-medium-14 text-gray-500">주문번호: {order.orderNumber}</p>
              <p className="typo-medium-14 text-gray-500">{formatDate(order.createdAt)}</p>
            </div>
            <span className={`typo-bold-14 rounded px-3 py-1 ${status.colorClass}`}>{status.label}</span>
          </div>

          {/* 상품 정보 */}
          <div className="border-t pt-4">
            <h4 className="mb-3 font-bold text-gray-900">상품 정보</h4>
            <div className="typo-medium-14 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">{displayNames.isBottleReservation ? "공고명" : "상품명"}</span>
                <span className="typo-medium-14">{displayNames.primaryName}</span>
              </div>
              {displayNames.secondaryName && <DetailRow label="보틀명" value={displayNames.secondaryName} />}
              <DetailRow label="주문 분류" value={orderClassification} />
              <div className="flex justify-between">
                <span className="text-gray-500">신청 수량</span>
                <span className="typo-medium-14">{order.requestedQuantity}병</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">배정 수량</span>
                <span className="typo-medium-14">{order.approvedQuantity}병</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">단가</span>
                <span className="typo-medium-14">{formatCurrency(order.unitPrice)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="typo-semibold-14 text-gray-900">총 금액</span>
                <span className="typo-bold-14 text-gray-900">{formatCurrency(order.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* 결제 정보 */}
          {order.payment && (
            <div className="border-t pt-4">
              <h4 className="mb-3 font-bold text-gray-900">결제 정보</h4>
              <div className="typo-medium-14 space-y-2">
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
              <div className="typo-medium-14 space-y-2">
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
              <p className="typo-medium-14 text-gray-600">{order.cancelReason}</p>
            </div>
          )}

          {/* 주문 상태 변경 버튼 */}
          {(canCompleteReceipt || canCancel) && (
            <div className="border-t pt-4">
              <div className="flex flex-wrap gap-2">
                {canCompleteReceipt ? (
                  <ReceiptCompleteButton orderId={order.id!} itemName={displayNames.primaryName} onCompleted={close} />
                ) : null}
                {canCancel ? (
                  <Button variant="destructive" onClick={handleCancelClick}>
                    주문 취소
                  </Button>
                ) : null}
              </div>
            </div>
          )}
          {displayNames.isBottleReservation && order.id && (
            <div className="border-t pt-4">
              <Button variant="outline" asChild>
                <Link href={`/my-page/reservations/${order.id}`}>공고 내용 보기</Link>
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
      <span className="typo-medium-14 text-right break-words text-gray-900">{value || "-"}</span>
    </div>
  );
}
