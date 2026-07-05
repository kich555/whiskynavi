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
import { useState } from "react";

interface CancelReservationModalProps {
  isOpen: boolean;
  close: () => void;
  onConfirm: () => Promise<void>;
}

export default function CancelReservationModal({ isOpen, close, onConfirm }: CancelReservationModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    await onConfirm();
    setIsConfirming(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="typo-bold-20">예약 취소</DialogTitle>
          <DialogDescription className="pt-2 text-gray-600">정말 취소하시겠습니까?</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1" onClick={close} disabled={isConfirming}>
            닫기
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleConfirm} disabled={isConfirming}>
            {isConfirming ? "취소 중..." : "취소하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
