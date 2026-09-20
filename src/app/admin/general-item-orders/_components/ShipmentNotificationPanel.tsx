"use client";

import type { ShipmentNotificationAuditResponse, ShipmentNotificationResponse } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/formatters";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { recoverShipmentNotification } from "../shipment-notification-actions";
import ShipmentNotificationTable from "./ShipmentNotificationTable";

const ACTIONS: Record<string, string> = {
  SENT: "발송 접수",
  ATTEMPT_FAILED: "발송 시도 실패",
  FAILED: "발송 중단",
  MANUAL_RETRY: "관리자 재발송",
  SUPERSEDED: "송장 변경으로 제외",
  EXPIRED: "재발송 기간 만료",
};
export default function ShipmentNotificationPanel({
  orderId,
  rows,
  history,
}: {
  orderId: number;
  rows: ShipmentNotificationResponse[];
  history: ShipmentNotificationAuditResponse[];
}) {
  const router = useRouter();
  const [selection, setSelection] = useState<{ notificationId: number } | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  function open(next: NonNullable<typeof selection>) {
    setSelection(next);
    setReason("");
    setError("");
  }
  function submit() {
    if (!selection) return;
    const input = { ...selection, reason };
    startTransition(async () => {
      try {
        const result = await recoverShipmentNotification(orderId, input);
        if (!result.success) {
          setError(result.error);
          return;
        }
        setSelection(null);
        setNotice("출고 알림 재발송을 예약했습니다.");
        router.refresh();
      } catch {
        setError("요청 결과를 확인하지 못했습니다. 새로고침 후 발송 이력을 확인해 주세요.");
      }
    });
  }
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="typo-bold-18">출고 알림</h3>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={() => router.refresh()}>
            상태 새로고침
          </Button>
        </div>
      </div>
      <p className="typo-medium-14 my-4 leading-relaxed text-gray-600">
        발송 접수는 수신 완료를 의미하지 않습니다. 이메일과 문자는 각각 최대 5회 자동 시도합니다. 재발송은 최초 작업
        생성 후 7일 동안, 수동 요청은 1분 간격으로 가능합니다. 송장이 바뀌면 최신 송장의 알림을 선택해 주세요.
      </p>
      {notice && (
        <p role="status" className="typo-medium-14 mb-4 text-green-800">
          {notice}
        </p>
      )}
      <ShipmentNotificationTable
        rows={rows}
        renderAction={(row) => (
          <Button
            type="button"
            variant="outline"
            disabled={pending || !row.retryable || !row.id}
            onClick={() => row.id && open({ notificationId: row.id })}
          >
            재발송
          </Button>
        )}
      />
      {rows.length === 50 && (
        <Link
          className="typo-medium-14 mt-3 inline-block text-amber-700 underline"
          href={`?orderId=${orderId}&notificationBeforeId=${rows.at(-1)?.id}`}
        >
          이전 발송 기록
        </Link>
      )}
      <h4 className="typo-bold-14 mt-6 mb-3">처리 이력</h4>
      {history.length === 0 ? (
        <p className="typo-medium-14 text-gray-500">처리 이력이 없습니다.</p>
      ) : (
        <ul className="typo-medium-14 space-y-3">
          {history.map((event) => (
            <li key={event.id} className="border-b pb-3 leading-relaxed">
              <span>
                {formatDateTime(event.createdAt)} · {ACTIONS[event.action ?? ""] ?? event.action}
              </span>
              {event.actorId && <span> · 관리자 #{event.actorId}</span>}
              {event.notificationId && <span> · 발송 #{event.notificationId}</span>}
              {event.reason && (
                <p className="break-words text-gray-600">
                  {event.action === "MANUAL_RETRY" ? event.reason : "발송 오류 기록"}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      {history.length === 50 && (
        <Link
          className="typo-medium-14 mt-3 inline-block text-amber-700 underline"
          href={`?orderId=${orderId}&historyBeforeId=${history.at(-1)?.id}`}
        >
          이전 처리 이력
        </Link>
      )}
      <Dialog
        open={selection !== null}
        onOpenChange={(value) => {
          if (!value && !pending) setSelection(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>출고 알림 재발송</DialogTitle>
            <DialogDescription>
              주문에 등록된 연락처로 선택한 채널의 출고 알림을 보냅니다. 이미 수신했다면 중복 안내가 될 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <label className="typo-medium-14 space-y-2">
            처리 사유 (필수)
            <Textarea
              aria-label="처리 사유"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={200}
              disabled={pending}
              placeholder="처리 사유만 적어 주세요. 연락처 등 개인정보는 입력하지 마세요."
            />
          </label>
          {error && (
            <p role="alert" className="typo-medium-14 text-red-700">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => setSelection(null)}>
              취소
            </Button>
            <Button type="button" disabled={pending || !reason.trim()} onClick={submit}>
              {pending ? "처리 중…" : "발송 예약"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
