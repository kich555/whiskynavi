"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { confirmApplicationAction } from "../../actions";

interface ApplicationConfirmModalProps {
  isOpen: boolean;
  close: () => void;
  applicationId: number;
  applicantName: string;
  requestedQuantity: number;
  initialQuantity?: number;
  mode?: "confirm" | "edit";
}

export default function ApplicationConfirmModal({
  isOpen,
  close,
  applicationId,
  applicantName,
  requestedQuantity,
  initialQuantity,
  mode = "confirm",
}: ApplicationConfirmModalProps) {
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(initialQuantity ?? requestedQuantity);
  const router = useRouter();
  const isEditMode = mode === "edit";

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await confirmApplicationAction(applicationId, quantity);
      if (result.success) {
        close();
        router.refresh();
      } else {
        toast.error(result.error || "확정에 실패했습니다.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check size={24} className="text-green-600" />
            </div>
            <DialogTitle>{isEditMode ? "확정 수량 수정" : "신청 확정"}</DialogTitle>
          </div>
          <DialogDescription>
            <strong>{applicantName}</strong>님의 {isEditMode ? "확정 수량을 수정합니다." : "신청을 확정합니다."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <label className="typo-medium-14 mb-1 block text-gray-700">확정 수량</label>
          <input
            type="number"
            min={1}
            max={requestedQuantity}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">신청 수량: {requestedQuantity}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={isPending}>
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || quantity < 1 || quantity > requestedQuantity}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {isPending ? "처리 중..." : isEditMode ? "수정" : "확정"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
