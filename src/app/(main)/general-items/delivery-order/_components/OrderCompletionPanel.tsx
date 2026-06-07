"use client";

import type { UserGeneralItemDeliveryOrderResponse } from "@/apis/generated/api";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

interface OrderCompletionPanelProps {
  result: UserGeneralItemDeliveryOrderResponse;
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
      <dt className="text-sm text-gray-400">{label}</dt>
      <dd className="max-w-[65%] text-right text-sm font-medium break-words text-white">{value || "-"}</dd>
    </div>
  );
}

export default function OrderCompletionPanel({ result }: OrderCompletionPanelProps) {
  const [copied, setCopied] = useState(false);
  const order = result.order;
  const payment = order?.payment;
  const depositDeadline = result.depositDeadlineAt ?? payment?.depositDeadlineAt;
  const lookupHref =
    order?.orderNumber && result.guestOrderToken
      ? `/orders/guest?orderNumber=${encodeURIComponent(order.orderNumber)}&guestOrderToken=${encodeURIComponent(
          result.guestOrderToken,
        )}`
      : "/my-page?tab=orders";

  const handleCopyToken = async () => {
    if (!result.guestOrderToken || !navigator.clipboard) return;
    await navigator.clipboard.writeText(result.guestOrderToken);
    setCopied(true);
  };

  return (
    <section className="border border-white/10 bg-white/5 p-5 md:p-8">
      <div className="mb-6">
        <p className="text-sm text-amber-300">주문 접수가 완료되었습니다.</p>
        <h2 className="typo-bold-24 mt-2 text-white">주문 정보를 확인해 주세요.</h2>
      </div>

      <dl className="space-y-3">
        <InfoRow label="주문번호" value={order?.orderNumber} />
        <InfoRow label="주문상태" value={order?.orderStatus} />
        {payment?.paymentMethod && <InfoRow label="결제수단" value={payment.paymentMethod} />}
        {payment?.paymentStatus && <InfoRow label="결제상태" value={payment.paymentStatus} />}
        {payment?.paidAmount != null && <InfoRow label="결제금액" value={formatCurrency(payment.paidAmount)} />}
        {payment?.paidAt && <InfoRow label="결제일시" value={formatDateTime(payment.paidAt)} />}
      </dl>

      {result.guestOrderToken && (
        <div className="mt-6 border border-amber-400/30 bg-amber-400/10 p-4">
          <p className="text-sm text-amber-200">비회원 조회 코드</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <strong className="font-mono text-lg text-white">{result.guestOrderToken}</strong>
            <Button type="button" variant="outline" onClick={handleCopyToken}>
              {copied ? "복사됨" : "조회 코드 복사"}
            </Button>
          </div>
          <p className="mt-3 text-xs leading-5 text-amber-100/80">
            조회 코드는 최초 주문 완료 화면에서만 다시 확인할 수 있습니다. 주문번호와 함께 보관해 주세요.
          </p>
        </div>
      )}

      {(payment?.bankName || payment?.bankAccountNumber || payment?.bankTransferGuideMessage || depositDeadline) && (
        <div className="mt-6 border border-white/10 bg-black/20 p-4">
          <h3 className="typo-bold-18 mb-4 text-white">입금 안내</h3>
          <dl className="space-y-3">
            <InfoRow label="입금 은행" value={payment?.bankName} />
            <InfoRow label="입금 계좌" value={payment?.bankAccountNumber} />
            <InfoRow label="예금주" value={payment?.bankAccountHolderName} />
            <InfoRow label="입금 기한" value={formatDateTime(depositDeadline)} />
          </dl>
          {payment?.bankTransferGuideMessage && (
            <p className="mt-4 rounded-md bg-white/5 p-3 text-sm leading-6 text-gray-200">
              {payment.bankTransferGuideMessage}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="bg-amber-600 hover:bg-amber-700">
          <Link href={lookupHref}>{result.guestOrderToken ? "비회원 주문 조회" : "내 주문 보러가기"}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">홈으로</Link>
        </Button>
      </div>
    </section>
  );
}
