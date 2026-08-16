"use client";

import { Button } from "@/components/ui/button";
import { overlay } from "overlay-kit";
import type { MouseEvent } from "react";
import ReceiptConfirmationModal from "./ReceiptConfirmationModal";

interface ReceiptCompleteButtonProps {
  orderId: number;
  itemName?: string;
  onCompleted?: () => void;
  className?: string;
}

export default function ReceiptCompleteButton({
  orderId,
  itemName,
  onCompleted,
  className,
}: ReceiptCompleteButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    overlay.open(({ isOpen, close }) => (
      <ReceiptConfirmationModal
        isOpen={isOpen}
        close={close}
        orderId={orderId}
        itemName={itemName}
        onCompleted={onCompleted}
      />
    ));
  };

  return (
    <Button variant="outline" className={className} onClick={handleClick}>
      수령완료 처리
    </Button>
  );
}
