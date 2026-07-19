"use client";

import type { UserOrderResponse } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { formatOrderClassification } from "@/lib/order-classification";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  canRequestDeliveryOrderCancel,
  getDeliveryProgressLabel,
  getGeneralItemOrderStatusConfig,
} from "../../general-items/delivery-order/_lib/order-utils";
import { cancelGuestGeneralItemOrder, lookupGuestGeneralItemOrder } from "../../general-items/delivery-order/actions";

interface GuestOrderLookupClientProps {
  initialOrderNumber?: string;
  initialGuestOrderToken?: string;
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
      <dt className="typo-medium-14 text-gray-400">{label}</dt>
      <dd className="typo-medium-14 max-w-[65%] text-right break-words text-white">{value || "-"}</dd>
    </div>
  );
}

function GuestOrderDetail({
  order,
  guestOrderToken,
  onCancel,
  isPending,
}: {
  order: UserOrderResponse;
  guestOrderToken: string;
  onCancel: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");
  const status = getGeneralItemOrderStatusConfig(order.orderStatus);
  const canCancel = canRequestDeliveryOrderCancel(order.orderStatus);
  const delivery = order.delivery;
  const payment = order.payment;
  const orderClassification = formatOrderClassification(order);

  return (
    <section className="mt-8 border border-white/10 bg-white/5 p-5 md:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="typo-medium-14 text-gray-400">주문번호</p>
          <h2 className="typo-bold-20 mt-1 text-white">{order.orderNumber}</h2>
        </div>
        <span className={`typo-bold-14 w-fit border px-3 py-1 ${status.colorClass}`}>{status.label}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="typo-bold-18 mb-4 text-white">주문 정보</h3>
          <dl className="space-y-3">
            <InfoRow label="상품명" value={order.itemName || order.saleTitle} />
            <InfoRow label="주문 분류" value={orderClassification} />
            <InfoRow label="수량" value={order.requestedQuantity ? `${order.requestedQuantity}개` : "-"} />
            <InfoRow label="총 금액" value={formatCurrency(order.totalPrice)} />
            <InfoRow label="결제수단" value={payment?.paymentMethod} />
            <InfoRow label="결제상태" value={payment?.paymentStatus} />
            <InfoRow label="주문 메모" value={order.orderNote} />
          </dl>
        </div>

        <div>
          <h3 className="typo-bold-18 mb-4 text-white">배송 정보</h3>
          <dl className="space-y-3">
            <InfoRow label="배송 진행" value={getDeliveryProgressLabel(order.orderStatus, delivery)} />
            <InfoRow label="수령인" value={delivery?.receiverName} />
            <InfoRow label="연락처" value={delivery?.receiverPhone} />
            <InfoRow label="주소" value={delivery?.address} />
            <InfoRow label="배송사" value={delivery?.carrierName || "CJ대한통운"} />
            <InfoRow label="운송장번호" value={delivery?.trackingNumber || "배송 준비 중"} />
            <InfoRow label="발송일시" value={formatDateTime(delivery?.shippedAt)} />
            <InfoRow label="배송완료일시" value={formatDateTime(delivery?.deliveredAt)} />
          </dl>
        </div>
      </div>

      {canCancel && (
        <div className="mt-8 border-t border-white/10 pt-6">
          <h3 className="typo-bold-18 text-white">주문 취소</h3>
          <p className="typo-medium-14 mt-2 text-gray-400">
            결제 완료 주문은 취소 요청으로 접수되며, 관리자가 승인하면 결제와 주문이 취소됩니다.
          </p>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="취소 사유"
            className="mt-4 min-h-24 border-white/15 bg-black/20 text-white"
          />
          <Button
            type="button"
            variant="destructive"
            className="mt-3"
            disabled={isPending}
            onClick={() => onCancel(reason)}
          >
            {isPending ? "취소 요청 중" : "주문 취소 요청"}
          </Button>
        </div>
      )}

      <p className="typo-medium-12 mt-6 font-mono text-gray-500">조회 코드: {guestOrderToken}</p>
    </section>
  );
}

export default function GuestOrderLookupClient({
  initialOrderNumber = "",
  initialGuestOrderToken = "",
}: GuestOrderLookupClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [guestOrderToken, setGuestOrderToken] = useState(initialGuestOrderToken);
  const [order, setOrder] = useState<UserOrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookup = (nextOrderNumber = orderNumber, nextToken = guestOrderToken) => {
    setError(null);
    startTransition(async () => {
      const result = await lookupGuestGeneralItemOrder(nextOrderNumber, nextToken);
      if (result.success) {
        setOrder(result.data ?? null);
        router.replace(
          `/orders/guest?orderNumber=${encodeURIComponent(nextOrderNumber)}&guestOrderToken=${encodeURIComponent(
            nextToken,
          )}`,
          { scroll: false },
        );
      } else {
        setOrder(null);
        setError(result.error ?? "비회원 주문 조회에 실패했습니다.");
      }
    });
  };

  const cancelOrder = (reason: string) => {
    if (!order?.orderNumber) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelGuestGeneralItemOrder(order.orderNumber!, guestOrderToken, reason);
      if (result.success) {
        setOrder(result.data ?? null);
      } else {
        setError(result.error ?? "비회원 주문 취소에 실패했습니다.");
      }
    });
  };

  useEffect(() => {
    if (initialOrderNumber && initialGuestOrderToken) {
      lookup(initialOrderNumber, initialGuestOrderToken);
    }
    // Initial query params should trigger one lookup on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-10 md:pt-32 md:pb-16">
      <section className="border border-white/10 bg-white/5 p-5 md:p-8">
        <p className="typo-medium-14 text-amber-300">비회원 주문내역 조회</p>
        <h1 className="typo-bold-24 mt-2 text-white md:text-3xl">주문번호와 조회 코드를 입력해 주세요.</h1>

        <form
          className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            lookup();
          }}
        >
          <div>
            <label className="typo-medium-14 mb-2 block text-gray-200" htmlFor="guestOrderNumber">
              주문번호
            </label>
            <Input
              id="guestOrderNumber"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="ODR-20260519-000001"
              className="border-white/15 bg-black/20 text-white"
            />
          </div>
          <div>
            <label className="typo-medium-14 mb-2 block text-gray-200" htmlFor="guestOrderToken">
              비회원 주문 조회 코드
            </label>
            <Input
              id="guestOrderToken"
              value={guestOrderToken}
              onChange={(event) => setGuestOrderToken(event.target.value)}
              placeholder="A1B2-C3D4"
              className="border-white/15 bg-black/20 text-white"
            />
          </div>
          <Button type="submit" disabled={isPending} className="bg-amber-600 hover:bg-amber-700">
            {isPending ? "조회 중" : "조회"}
          </Button>
        </form>

        {error && (
          <p className="typo-medium-14 mt-5 border border-red-400/30 bg-red-400/10 p-3 text-red-200">{error}</p>
        )}
      </section>

      {order && (
        <GuestOrderDetail
          order={order}
          guestOrderToken={guestOrderToken}
          isPending={isPending}
          onCancel={cancelOrder}
        />
      )}
    </div>
  );
}
