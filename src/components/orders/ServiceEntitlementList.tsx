import type { UserServiceEntitlementResponse } from "@/apis/generated/api";
import type { ReactNode } from "react";

const labels: Record<string, string> = {
  AVAILABLE: "이용 가능",
  USED: "사용 완료",
  CANCELED: "취소",
  EXPIRED: "만료",
  SUSPENDED: "이용 정지 (결제·취소 상태 확인)",
  NOT_YET_VALID: "이용 시작 전",
};
function date(value?: string) {
  return value?.replace("T", " ") ?? "-";
}

export default function ServiceEntitlementList({
  rows,
  renderAction,
}: {
  rows: UserServiceEntitlementResponse[];
  renderAction?: (row: UserServiceEntitlementResponse) => ReactNode;
}) {
  const used = rows.filter((row) => row.usedAt).length;
  return (
    <section className="space-y-4" aria-label="이용권 목록">
      <h3 className="typo-bold-18">이용권</h3>
      <p className="typo-medium-14 leading-6">
        {rows.length}장 중 {used}장 사용 · 배송 없음
      </p>
      {!rows.length && (
        <p className="typo-medium-14 leading-6">
          아직 발급된 이용권이 없습니다. 결제 완료 후에도 표시되지 않으면 고객센터에 문의해 주세요.
        </p>
      )}
      <ul className="grid gap-3">
        {rows.map((row) => (
          <li key={row.id} className="space-y-3 rounded border border-current/20 p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <strong className="typo-bold-16">
                {row.itemName} · {row.unitNumber}번
              </strong>
              <span className="typo-medium-14">{labels[row.status ?? ""] ?? "상태 확인 필요"}</span>
            </div>
            <p className="typo-medium-14 leading-6">
              이용권 번호: {row.id}
              <br />
              이용 기간 (한국 시간): {row.validFrom ? date(row.validFrom) : "발급 즉시"} ~ {date(row.validUntil)}
            </p>
            {row.usedAt && <p className="typo-medium-14">사용 시각: {date(row.usedAt)}</p>}
            {renderAction?.(row)}
          </li>
        ))}
      </ul>
    </section>
  );
}
