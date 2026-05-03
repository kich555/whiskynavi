"use client";

import type { PickupLocationResponse } from "@/apis/generated/api";
import { FormMessage } from "@/components/ui/form-message";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  HOUSEHOLD: "가정용",
  ENTERTAINMENT: "유흥용",
};

const formatBusinessType = (location: PickupLocationResponse & { businessType?: string }): string => {
  const businessType = location.businessType;
  if (!businessType) return "-";
  return BUSINESS_TYPE_LABEL[businessType] ?? businessType;
};

interface ApplyFormProps {
  onApply: (quantity: number, userBusinessId: number) => void;
  isPending: boolean;
  pickupLocations: PickupLocationResponse[];
  error?: string | null;
}

export default function ApplyForm({ onApply, isPending, pickupLocations, error }: ApplyFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  const canSubmit = selectedLocationId !== "" && !isPending;

  return (
    <div className="space-y-3">
      {/* 업장 선택 */}
      <div>
        <label className="mb-1 block text-xs text-gray-400 lg:text-sm">수령 업장</label>
        <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
          <SelectTrigger className="w-full border-white/20 bg-white/10 text-sm text-white lg:text-base [&>svg]:text-white/60">
            <SelectValue placeholder="업장을 선택해주세요" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
            {pickupLocations.map((loc) => (
              <SelectItem key={loc.id} value={String(loc.id)}>
                {loc.businessName} · {formatBusinessType(loc)}
                {loc.pickupAddress ? ` (${loc.pickupAddress})` : ""}
              </SelectItem>
            ))}
            {pickupLocations.length === 0 && (
              <div className="text-muted-foreground px-2 py-4 text-center text-sm">등록된 업장이 없습니다</div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 수량 + 신청 */}
      <div>
        <div className="mb-1 flex gap-2 lg:mb-2 lg:gap-3">
          <div className="relative">
            <input
              type="number"
              min="1"
              max="10"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              className="w-20 border border-white/20 bg-white/10 py-2.5 pr-8 pl-2 text-center text-base text-white transition-colors focus:border-white/40 focus:outline-none lg:h-full lg:w-40 lg:pr-10 lg:pl-3 lg:text-lg"
            />
            <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-base text-white/60 lg:right-3 lg:text-lg">
              병
            </span>
          </div>
          <button
            type="button"
            onClick={() => onApply(quantity, Number(selectedLocationId))}
            disabled={!canSubmit}
            className="typo-bold-16 flex-1 bg-white px-4 py-2.5 text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 lg:px-6 lg:text-xl"
          >
            {isPending ? "신청 중..." : "예약하기"}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 lg:text-xs">
          * 예약 신청 병수와 실제 배정 병수는 총 신청 수에 따라 달라질 수 있습니다.
        </p>
        <FormMessage message={error} className="mt-2" />
      </div>
    </div>
  );
}
