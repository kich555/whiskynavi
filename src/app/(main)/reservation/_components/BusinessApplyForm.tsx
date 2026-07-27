"use client";

import { FormMessage } from "@/components/ui/form-message";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

export interface ReservationBusinessOption {
  businessId: number;
  businessName: string;
  pickupAddress?: string;
}

interface BusinessApplyFormProps {
  businesses: ReservationBusinessOption[];
  selectedBusinessId?: number;
  onBusinessChange: (businessId: number) => void;
  onApply: (quantity: number) => void;
  isPending: boolean;
  error?: string | null;
  mode?: "apply" | "edit";
  initialQuantity?: number;
  onCancelEdit?: () => void;
  maxQuantity?: number;
}

export default function BusinessApplyForm({
  businesses,
  selectedBusinessId,
  onBusinessChange,
  onApply,
  isPending,
  error,
  mode = "apply",
  initialQuantity,
  onCancelEdit,
  maxQuantity = 100,
}: BusinessApplyFormProps) {
  const [quantity, setQuantity] = useState(initialQuantity ?? 1);
  const [quantityInput, setQuantityInput] = useState(String(initialQuantity ?? 1));
  const selectedBusiness = businesses.find((business) => business.businessId === selectedBusinessId);
  const canSubmit = selectedBusinessId != null && !isPending;

  return (
    <div className="space-y-3">
      <div>
        <label className="typo-medium-12 lg:typo-medium-14 mb-1 block text-gray-400">신청 사업장</label>
        {mode === "edit" ? (
          <div className="typo-medium-14 border border-white/20 bg-white/10 px-3 py-2.5 text-white">
            {selectedBusiness?.businessName ?? "-"}
          </div>
        ) : (
          <Select
            value={selectedBusinessId ? String(selectedBusinessId) : ""}
            onValueChange={(value) => onBusinessChange(Number(value))}
            disabled={isPending}
          >
            <SelectTrigger className="typo-medium-14 w-full border-white/20 bg-white/10 text-white lg:text-base [&>svg]:text-white/60">
              <SelectValue placeholder="신청할 사업장을 선택해 주세요" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
              {businesses.map((business) => (
                <SelectItem key={business.businessId} value={String(business.businessId)}>
                  {business.businessName}
                </SelectItem>
              ))}
              {businesses.length === 0 ? (
                <div className="text-muted-foreground typo-medium-14 px-2 py-4 text-center">
                  관리 가능한 사업장이 없습니다
                </div>
              ) : null}
            </SelectContent>
          </Select>
        )}
        <p className="typo-medium-12 mt-2 text-gray-400">
          픽업 장소는 관리자 설정에 따라 서버에서 확정되며, 신청 완료 후 표시됩니다.
        </p>
      </div>

      <div>
        <div className="mb-1 flex gap-2 lg:mb-2 lg:gap-3">
          <div className="relative">
            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantityInput}
              onChange={(event) => {
                const raw = event.target.value;
                setQuantityInput(raw);
                const parsed = Number.parseInt(raw, 10);
                if (!Number.isNaN(parsed)) {
                  setQuantity(Math.max(1, Math.min(maxQuantity, parsed)));
                }
              }}
              onBlur={() => {
                const parsed = Number.parseInt(quantityInput, 10);
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
          {mode === "edit" ? (
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isPending}
              className="typo-bold-16 border border-white/20 px-4 py-2.5 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 lg:px-6 lg:text-xl"
            >
              닫기
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onApply(quantity)}
            disabled={!canSubmit}
            className="typo-bold-16 flex-1 bg-white px-4 py-2.5 text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 lg:px-6 lg:text-xl"
          >
            {mode === "edit" ? (isPending ? "수정 중..." : "수정하기") : isPending ? "신청 중..." : "예약하기"}
          </button>
        </div>
        <p className="lg:typo-medium-12 text-[10px] text-gray-400">
          * 예약 신청 병수와 실제 배정 병수는 총 신청 수에 따라 달라질 수 있습니다.
        </p>
        <FormMessage message={error} className="mt-2" />
      </div>
    </div>
  );
}
