"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { useState, useTransition } from "react";
import { cancelOrder } from "../actions";

interface OrderCancelModalProps {
  isOpen: boolean;
  close: () => void;
  orderId: number;
  itemName?: string;
}

export default function OrderCancelModal({ isOpen, close, orderId, itemName }: OrderCancelModalProps) {
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelOrder(orderId, reason || undefined);
      if (result.success) {
        close();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>주문 취소</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="typo-medium-14 text-gray-600">
            <span className="typo-semibold-14">{itemName}</span> 주문을 취소하시겠습니까?
          </p>
          <div>
            <label className="typo-bold-14 mb-2 block text-gray-700">취소 사유 (선택)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="취소 사유를 입력해주세요"
              className="typo-medium-14 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-gray-600 focus:outline-none"
            />
          </div>
          <FormMessage message={error} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={isPending}>
            돌아가기
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
            {isPending ? "취소 중..." : "주문 취소"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
