"use client";

import type { GuestNotificationAuditResponse, GuestNotificationResponse } from "@/apis/generated/api";
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
import { recoverGuestNotification } from "../notification-actions";
import GuestNotificationTable from "./GuestNotificationTable";

const ACTIONS: Record<string, string> = {
  SENT: "발송 접수",
  ATTEMPT_FAILED: "발송 시도 실패",
  FAILED: "발송 중단",
  MANUAL_RETRY: "관리자 재발송",
  TOKEN_REISSUED: "조회 코드 재발급",
};
export default function GuestNotificationPanel({
  orderId,
  rows,
  history,
}: {
  orderId: number;
  rows: GuestNotificationResponse[];
  history: GuestNotificationAuditResponse[];
}) {
  const router = useRouter();
  const [selection, setSelection] = useState<
    { action: "retry"; notificationId: number } | { action: "reissue" } | null
  >(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  function open(next: NonNullable<typeof selection>) {
    setSelection(next);
    setReason("");
    setConfirmed(false);
    setError("");
  }
  function submit() {
    if (!selection) return;
    const input =
      selection.action === "retry" ? { ...selection, reason } : { ...selection, reason, identityConfirmed: confirmed };
    startTransition(async () => {
      try {
        const result = await recoverGuestNotification(orderId, input);
        if (!result.success) {
          setError(result.error);
          return;
        }
        setSelection(null);
        setNotice(
          input.action === "reissue"
            ? "기존 코드를 폐기하고 새 코드 안내를 예약했습니다."
            : "같은 코드로 재발송을 예약했습니다.",
        );
        router.refresh();
      } catch {
        setError("요청 결과를 확인하지 못했습니다. 새로고침 후 발송 이력을 확인해 주세요.");
      }
    });
  }
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="typo-bold-18">비회원 주문 안내</h3>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={() => router.refresh()}>
            상태 새로고침
          </Button>
          <Button type="button" variant="outline" disabled={pending} onClick={() => open({ action: "reissue" })}>
            조회 코드 재발급
          </Button>
        </div>
      </div>
      <p className="typo-medium-14 my-4 leading-relaxed text-gray-600">
        발송 접수는 수신 완료를 의미하지 않습니다. 자동 재시도는 채널별 최대 5회입니다. 같은 코드의 재발송은 발급 후
        24시간 동안 가능하며, 이후에는 본인 확인 후 재발급해 주세요. 수동 요청은 1분 간격으로 가능합니다.
      </p>
      {notice && (
        <p role="status" className="typo-medium-14 mb-4 text-green-800">
          {notice}
        </p>
      )}
      <GuestNotificationTable
        rows={rows}
        renderAction={(row) => (
          <Button
            type="button"
            variant="outline"
            disabled={pending || !row.retryable || !row.id}
            onClick={() => row.id && open({ action: "retry", notificationId: row.id })}
          >
            재발송
          </Button>
        )}
      />
      {rows.length === 50 && (
        <Link
          className="typo-medium-14 mt-3 inline-block text-amber-700 underline"
          href={`?notificationBeforeId=${rows.at(-1)?.id}`}
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
                  {event.action === "MANUAL_RETRY" || event.action === "TOKEN_REISSUED"
                    ? event.reason
                    : "발송 오류 기록"}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      {history.length === 50 && (
        <Link
          className="typo-medium-14 mt-3 inline-block text-amber-700 underline"
          href={`?historyBeforeId=${history.at(-1)?.id}`}
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
            <DialogTitle>{selection?.action === "reissue" ? "조회 코드 재발급" : "안내 재발송"}</DialogTitle>
            <DialogDescription>
              {selection?.action === "reissue"
                ? "기존 코드는 즉시 무효화됩니다. 새 코드는 주문에 등록된 이메일과 휴대폰으로만 발송합니다."
                : "선택한 채널에 같은 조회 코드를 다시 발송합니다. 이미 수신했다면 중복 안내가 될 수 있습니다."}
            </DialogDescription>
          </DialogHeader>
          {selection?.action === "reissue" && (
            <label className="typo-medium-14 flex items-start gap-2 leading-relaxed">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                disabled={pending}
              />
              등록 연락처와 주문 정보를 대조해 주문자 본인 확인을 완료했습니다.
            </label>
          )}
          <label className="typo-medium-14 space-y-2">
            처리 사유 (필수)
            <Textarea
              aria-label="처리 사유"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={200}
              disabled={pending}
              placeholder="확인 방법과 처리 사유만 적어 주세요. 조회 코드와 개인정보는 입력하지 마세요."
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
            <Button
              type="button"
              disabled={pending || !reason.trim() || (selection?.action === "reissue" && !confirmed)}
              onClick={submit}
            >
              {pending ? "처리 중…" : "발송 예약"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
