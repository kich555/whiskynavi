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
import { FormMessage } from "@/components/ui/form-message";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { completeReceipt } from "../actions";

interface ReceiptConfirmationModalProps {
  isOpen: boolean;
  close: () => void;
  orderId: number;
  itemName?: string;
  onCompleted?: () => void;
}

export default function ReceiptConfirmationModal({
  isOpen,
  close,
  orderId,
  itemName,
  onCompleted,
}: ReceiptConfirmationModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const handleConfirm = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await completeReceipt(orderId);
      if (!result.success) {
        setError(result.error);
        return;
      }

      close();
      onCompleted?.();
      router.refresh();
      toast.success("수령 완료로 처리했습니다.");
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <DialogTitle className="typo-bold-20">수령 완료 확인</DialogTitle>
          </div>
          <DialogDescription className="typo-medium-14 pt-3 text-gray-600">
            {itemName ? `${itemName} 주문을 ` : "이 주문을 "}수령 완료로 처리하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="typo-bold-14 text-red-700">처리 후에는 상태를 되돌릴 수 없습니다.</p>
          <p className="typo-medium-14 mt-2 text-red-700">실제로 상품을 수령한 경우에만 진행해 주세요.</p>
        </div>
        <FormMessage message={error} />

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1" onClick={close} disabled={isPending}>
            돌아가기
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleConfirm} disabled={isPending}>
            {isPending ? "처리 중..." : "수령완료 확정"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
