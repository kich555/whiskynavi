"use client";

import type { ShippingPolicyResponse } from "@/apis/generated/api";
import { useActionState, useCallback, useState } from "react";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import { type ShippingPolicyActionState, updateShippingPolicyAction } from "../actions";

interface ShippingPolicyContentProps {
  policy: ShippingPolicyResponse;
}

export default function ShippingPolicyContent({ policy }: ShippingPolicyContentProps) {
  const { toggle } = useSidebar();
  const [enabled, setEnabled] = useState(policy.enabled ?? false);
  const [baseShippingFee, setBaseShippingFee] = useState(String(policy.baseShippingFee ?? 0));
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(String(policy.freeShippingThreshold ?? 0));

  const handleAction = useCallback(async (prev: ShippingPolicyActionState, formData: FormData) => {
    return updateShippingPolicyAction(prev, formData);
  }, []);

  const [state, formAction, isPending] = useActionState<ShippingPolicyActionState, FormData>(handleAction, {
    success: false,
  });

  return (
    <div className="flex-1">
      <AdminHeader title="배송비 정책" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        <form action={formAction} className="max-w-2xl space-y-8 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <label htmlFor="enabled" className="block typo-medium-14 text-gray-900">
                정책 사용
              </label>
              <p className="mt-1 typo-medium-14 text-gray-500">배송비 정책 적용 여부를 설정합니다.</p>
            </div>
            <input
              id="enabled"
              name="enabled"
              type="checkbox"
              role="switch"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="h-6 w-11 cursor-pointer appearance-none rounded-full bg-gray-300 transition-colors before:block before:h-5 before:w-5 before:translate-x-0.5 before:translate-y-0.5 before:rounded-full before:bg-white before:transition-transform checked:bg-amber-600 checked:before:translate-x-5 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="baseShippingFee" className="mb-2 block typo-medium-14 text-gray-700">
              기본 배송비
            </label>
            <input
              id="baseShippingFee"
              name="baseShippingFee"
              type="number"
              min={0}
              step={1}
              disabled={isPending}
              value={baseShippingFee}
              onChange={(event) => setBaseShippingFee(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-right focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="freeShippingThreshold" className="mb-2 block typo-medium-14 text-gray-700">
              무료배송 기준 금액
            </label>
            <input
              id="freeShippingThreshold"
              name="freeShippingThreshold"
              type="number"
              min={0}
              step={1}
              disabled={isPending}
              value={freeShippingThreshold}
              onChange={(event) => setFreeShippingThreshold(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-right focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {state.error ? (
            <p role="alert" className="typo-medium-14 text-red-600">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p role="status" className="typo-medium-14 text-green-600">
              배송비 정책이 저장되었습니다.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-amber-600 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {isPending ? "저장 중..." : "정책 저장"}
          </button>
        </form>
      </div>
    </div>
  );
}
