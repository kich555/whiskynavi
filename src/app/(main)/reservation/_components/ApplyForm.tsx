"use client";

import type { PickupLocationResponse } from "@/apis/generated/api";
import { FormMessage } from "@/components/ui/form-message";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

interface ApplyFormProps {
  onApply: (quantity: number, userBusinessId: number) => void;
  isPending: boolean;
  pickupLocations: PickupLocationResponse[];
  error?: string | null;
  mode?: "apply" | "edit";
  initialQuantity?: number;
  initialLocationId?: number;
  onCancelEdit?: () => void;
  maxQuantity?: number;
}

export default function ApplyForm({
  onApply,
  isPending,
  pickupLocations,
  error,
  mode = "apply",
  initialQuantity,
  initialLocationId,
  onCancelEdit,
  maxQuantity = 100,
}: ApplyFormProps) {
  const initialLocationIdStr =
    initialLocationId != null && pickupLocations.some((loc) => loc.id === initialLocationId)
      ? String(initialLocationId)
      : "";
  const [quantity, setQuantity] = useState(initialQuantity ?? 1);
  const [quantityInput, setQuantityInput] = useState(String(initialQuantity ?? 1));
  const [selectedLocationId, setSelectedLocationId] = useState<string>(initialLocationIdStr);

  const canSubmit = selectedLocationId !== "" && !isPending;

  return (
    <div className="space-y-3">
      {/* 업장 선택 */}
      <div>
        <label className="typo-medium-12 mb-1 block text-gray-400 lg:typo-medium-14">수령 업장</label>
        <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
          <SelectTrigger className="typo-medium-14 w-full border-white/20 bg-white/10 text-white lg:text-base [&>svg]:text-white/60">
            <SelectValue placeholder="업장을 선택해주세요" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
            {pickupLocations.map((loc) => (
              <SelectItem key={loc.id} value={String(loc.id)}>
                {loc.businessName}
                {loc.pickupAddress ? ` (${loc.pickupAddress})` : ""}
              </SelectItem>
            ))}
            {pickupLocations.length === 0 && (
              <div className="text-muted-foreground typo-medium-14 px-2 py-4 text-center">등록된 업장이 없습니다</div>
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
              max={maxQuantity}
              value={quantityInput}
              onChange={(e) => {
                const raw = e.target.value;
                setQuantityInput(raw);
                const parsed = parseInt(raw, 10);
                if (!Number.isNaN(parsed)) {
                  setQuantity(Math.max(1, Math.min(maxQuantity, parsed)));
                }
              }}
              onBlur={() => {
                const parsed = parseInt(quantityInput, 10);
                const original = Number.isNaN(parsed) ? 1 : parsed;
                const clamped = Math.max(1, Math.min(maxQuantity, original));
                if (clamped !== original) {
                  toast.warning(`수량은 1~${maxQuantity}병까지 신청 가능하여 ${clamped}병으로 조정되었습니다.`);
                }
                setQuantity(clamped);
                setQuantityInput(String(clamped));
              }}
              className="w-20 border border-white/20 bg-white/10 py-2.5 pr-8 pl-2 text-center text-base text-white transition-colors focus:border-white/40 focus:outline-none lg:h-full lg:w-40 lg:pr-10 lg:pl-3 lg:text-lg"
            />
            <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-base text-white/60 lg:right-3 lg:text-lg">
              병
            </span>
          </div>
          {mode === "edit" && (
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isPending}
              className="typo-bold-16 border border-white/20 px-4 py-2.5 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 lg:px-6 lg:text-xl"
            >
              닫기
            </button>
          )}
          <button
            type="button"
            onClick={() => onApply(quantity, Number(selectedLocationId))}
            disabled={!canSubmit}
            className="typo-bold-16 flex-1 bg-white px-4 py-2.5 text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 lg:px-6 lg:text-xl"
          >
            {mode === "edit" ? (isPending ? "수정 중..." : "수정하기") : isPending ? "신청 중..." : "예약하기"}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 lg:typo-medium-12">
          * 예약 신청 병수와 실제 배정 병수는 총 신청 수에 따라 달라질 수 있습니다.
        </p>
        <FormMessage message={error} className="mt-2" />
      </div>
    </div>
  );
}
