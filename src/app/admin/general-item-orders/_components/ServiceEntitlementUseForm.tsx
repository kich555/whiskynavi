"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { markServiceEntitlementUsed } from "../entitlement-actions";

export default function ServiceEntitlementUseForm({
  orderId,
  entitlementId,
}: {
  orderId: number;
  entitlementId: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(false);
  return (
    <div className="space-y-3">
      {message && (
        <p role="status" className="typo-medium-14 leading-6">
          {message}
        </p>
      )}
      {!completed && (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const reason = String(new FormData(event.currentTarget).get("reason") ?? "");
            startTransition(async () => {
              try {
                const result = await markServiceEntitlementUsed(orderId, entitlementId, reason);
                setMessage(result.success ? "사용 처리했습니다." : result.error);
                if (result.success) setCompleted(true);
                router.refresh();
              } catch {
                setMessage("처리 결과를 확인하지 못했습니다. 목록을 새로고침해 주세요.");
                router.refresh();
              }
            });
          }}
        >
          <label className="sr-only" htmlFor={`use-reason-${entitlementId}`}>
            이용 확인 사유
          </label>
          <input
            id={`use-reason-${entitlementId}`}
            name="reason"
            required
            maxLength={500}
            placeholder="이용 확인 사유 (예: 현장 입장 확인)"
            disabled={pending}
            className="typo-medium-14 min-w-0 flex-1 rounded border border-gray-300 p-3"
          />
          <button
            disabled={pending}
            className="typo-bold-14 cursor-pointer rounded bg-amber-600 px-4 py-3 text-white disabled:opacity-50"
          >
            {pending ? "처리 중…" : "사용 처리"}
          </button>
        </form>
      )}
    </div>
  );
}
