import type { GuestNotificationResponse } from "@/apis/generated/api";
import { formatDateTime } from "@/lib/formatters";
import Link from "next/link";

export const GUEST_NOTIFICATION_STATUS: Record<string, string> = {
  PENDING: "발송 대기 / 재시도 중",
  SENT: "발송 접수",
  FAILED: "발송 실패",
  EXPIRED: "재시도 기한 만료",
  SUPERSEDED: "코드 폐기",
};
const ERRORS: Record<string, string> = {
  MISSING_RECIPIENT: "등록된 연락처 없음",
  PAYLOAD_EXPIRED: "발송 내용 보관 기한 만료",
  PAYLOAD_UNREADABLE: "발송 내용 복구 불가 · 코드 재발급 필요",
  DELIVERY_REJECTED_OR_UNCONFIRMED: "발송 거절 또는 접수 여부 확인 불가",
};

export default function GuestNotificationTable({
  rows,
  renderAction,
}: {
  rows: GuestNotificationResponse[];
  renderAction?: (row: GuestNotificationResponse) => React.ReactNode;
}) {
  if (rows.length === 0) return <p className="typo-medium-14 text-gray-500">발송 기록이 없습니다.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="typo-medium-14 w-full min-w-[720px]">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="p-3">주문 / 채널</th>
            <th className="p-3">수신처</th>
            <th className="p-3">상태</th>
            <th className="p-3">발송 시각</th>
            <th className="p-3">재시도</th>
            {renderAction && <th className="p-3">처리</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b align-top">
              <td className="p-3">
                <Link className="text-amber-700 underline" href={`/admin/general-item-orders/${row.orderId}`}>
                  #{row.orderId}
                </Link>
                <p className="mt-2">{row.channel === "SMS" ? "문자" : "이메일"}</p>
              </td>
              <td className="p-3 break-all">{row.maskedRecipient}</td>
              <td className="p-3">
                <p>{GUEST_NOTIFICATION_STATUS[row.status ?? ""] ?? row.status}</p>
                {row.lastError && (
                  <p className="typo-medium-12 mt-2 max-w-64 leading-relaxed text-red-700">
                    {ERRORS[row.lastError] ?? "발송 상태 확인 필요"}
                  </p>
                )}
              </td>
              <td className="p-3">{formatDateTime(row.sentAt ?? row.createdAt)}</td>
              <td className="p-3">
                <p>{row.attemptCount ?? 0} / 5회</p>
                {row.nextAttemptAt && <p className="typo-medium-12 mt-2">예정: {formatDateTime(row.nextAttemptAt)}</p>}
              </td>
              {renderAction && <td className="p-3">{renderAction(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
