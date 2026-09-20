"use client";
import type { UserServiceEntitlementResponse } from "@/apis/generated/api";
import { useEffect, useState, useTransition } from "react";
import ServiceEntitlementList from "./ServiceEntitlementList";
import { completeMyServiceEntitlement, lookupServiceEntitlements } from "./entitlement-actions";

export default function ServiceEntitlementPanel({
  orderId,
  guestOrderToken,
  orderStatus,
}: {
  orderId: number;
  guestOrderToken?: string;
  orderStatus?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ rows?: UserServiceEntitlementResponse[]; error?: string }>({});
  useEffect(() => {
    let active = true;
    lookupServiceEntitlements(orderId, guestOrderToken)
      .then((response) => {
        if (active) setResult(response.success ? { rows: response.data } : { error: response.error });
      })
      .catch(() => {
        if (active) setResult({ error: "이용권 조회에 실패했습니다. 다시 시도해 주세요." });
      });
    return () => {
      active = false;
    };
  }, [orderId, guestOrderToken, orderStatus, retry]);
  return (
    <div className="my-5 rounded border border-current/20 p-4">
      {message && (
        <p role="status" className="typo-medium-14 mb-4 leading-6">
          {message}
        </p>
      )}
      {result.error ? (
        <p role="alert" className="typo-medium-14 leading-6">
          {result.error}
        </p>
      ) : result.rows ? (
        <ServiceEntitlementList
          rows={result.rows}
          renderAction={(row) =>
            row.status === "AVAILABLE" && row.id != null ? (
              confirmId === row.id ? (
                <div className="space-y-3 rounded border border-current/30 p-3">
                  <p className="typo-medium-14 leading-6">
                    이 이용권을 사용 완료 처리하시겠습니까? 되돌릴 수 없으며 사용한 이용권이 포함된 주문은 전체 취소할
                    수 없습니다. 실제 이용 시에만 처리해 주세요.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={pending}
                      className="typo-bold-14 rounded bg-amber-600 px-4 py-3 text-white disabled:opacity-50"
                      onClick={() =>
                        startTransition(async () => {
                          try {
                            const response = await completeMyServiceEntitlement(orderId, row.id!, guestOrderToken);
                            setMessage(response.success ? "사용 완료 처리했습니다." : response.error);
                            setConfirmId(null);
                            setResult({});
                            setRetry((v) => v + 1);
                          } catch {
                            setMessage("처리 결과를 확인하지 못했습니다. 이용권을 새로고침해 주세요.");
                            setConfirmId(null);
                            setResult({});
                            setRetry((v) => v + 1);
                          }
                        })
                      }
                    >
                      {pending ? "처리 중…" : "확인 · 사용 완료"}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      className="typo-medium-14 rounded border border-current/30 px-4 py-3"
                      onClick={() => setConfirmId(null)}
                    >
                      돌아가기
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  className="typo-bold-14 rounded bg-amber-600 px-4 py-3 text-white disabled:opacity-50"
                  onClick={() => {
                    setMessage("");
                    setConfirmId(row.id!);
                  }}
                >
                  사용 완료 처리
                </button>
              )
            ) : null
          }
        />
      ) : (
        <p role="status">이용권 조회 중…</p>
      )}
      <button
        type="button"
        className="typo-medium-14 mt-4 cursor-pointer underline"
        disabled={pending}
        onClick={() => {
          setConfirmId(null);
          setResult({});
          setRetry((v) => v + 1);
        }}
      >
        이용권 새로고침
      </button>
    </div>
  );
}
