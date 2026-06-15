"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createManualPurchaseAction, type ManualPurchaseBottleOption } from "../../actions";
import ManualPurchaseBottleCombobox from "./ManualPurchaseBottleCombobox";

interface ManualPurchaseCreateModalProps {
  isOpen: boolean;
  close: () => void;
  userId: number;
}

function parseCurrencyInput(value: string): number {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return Number.NaN;
  return Number(normalized);
}

function formatCurrencyInput(value: number): string {
  return Number.isFinite(value) ? String(value) : "0";
}

export default function ManualPurchaseCreateModal({ isOpen, close, userId }: ManualPurchaseCreateModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedBottle, setSelectedBottle] = useState<ManualPurchaseBottleOption | null>(null);
  const [unitPrice, setUnitPrice] = useState("0");
  const [requestedQuantity, setRequestedQuantity] = useState("1");
  const [orderNote, setOrderNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const totalPrice = useMemo(() => {
    const price = parseCurrencyInput(unitPrice);
    const quantity = Number(requestedQuantity);
    if (!Number.isFinite(price) || !Number.isFinite(quantity)) return 0;
    return Math.max(price, 0) * Math.max(quantity, 0);
  }, [requestedQuantity, unitPrice]);

  const handleSelectBottle = (bottle: ManualPurchaseBottleOption) => {
    setSelectedBottle(bottle);
    setUnitPrice(formatCurrencyInput(bottle.consumerPrice ?? 0));
    setError(null);
  };

  const handleConfirm = () => {
    if (!selectedBottle) {
      setError("보틀을 선택해 주세요.");
      return;
    }

    const parsedUnitPrice = parseCurrencyInput(unitPrice);
    const parsedQuantity = Number(requestedQuantity);
    if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
      setError("단가를 입력해 주세요.");
      return;
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      setError("수량은 1개 이상이어야 합니다.");
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await createManualPurchaseAction(userId, {
        bottleId: selectedBottle.id,
        unitPrice: parsedUnitPrice,
        requestedQuantity: parsedQuantity,
        orderNote,
      });
      if (result.success) {
        close();
        router.refresh();
      } else {
        setError(result.error ?? "구매내역 추가에 실패했습니다.");
      }
    });
  };

  const invalid =
    !selectedBottle ||
    !Number.isFinite(parseCurrencyInput(unitPrice)) ||
    parseCurrencyInput(unitPrice) < 0 ||
    !Number.isInteger(Number(requestedQuantity)) ||
    Number(requestedQuantity) < 1 ||
    orderNote.length > 500;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="typo-bold-20">구매내역 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-1.5">
            <label className="typo-medium-14">
              보틀 <span className="text-red-500">*</span>
            </label>
            <ManualPurchaseBottleCombobox selected={selectedBottle} onSelect={handleSelectBottle} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="manualPurchaseUnitPrice" className="typo-medium-14">
                단가 <span className="text-red-500">*</span>
              </label>
              <input
                id="manualPurchaseUnitPrice"
                type="number"
                min={0}
                step={1}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="manualPurchaseQuantity" className="typo-medium-14">
                수량 <span className="text-red-500">*</span>
              </label>
              <input
                id="manualPurchaseQuantity"
                type="number"
                min={1}
                step={1}
                value={requestedQuantity}
                onChange={(e) => setRequestedQuantity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="manualPurchaseNote" className="typo-medium-14">
              메모
            </label>
            <textarea
              id="manualPurchaseNote"
              value={orderNote}
              maxLength={500}
              onChange={(e) => setOrderNote(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <p className="text-right text-xs text-gray-400">{orderNote.length}/500</p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">추가될 구매 금액</span>
              <span className="font-semibold text-gray-900">{totalPrice.toLocaleString("ko-KR")}원</span>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1" onClick={close} disabled={isPending}>
            취소
          </Button>
          <Button
            className="flex-1 bg-amber-600 hover:bg-amber-700"
            onClick={handleConfirm}
            disabled={invalid || isPending}
          >
            {isPending ? "추가 중..." : "구매내역 추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
