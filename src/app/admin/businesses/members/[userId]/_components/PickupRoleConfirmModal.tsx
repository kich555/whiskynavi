"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { grantPickupRoleAction, revokePickupRoleAction } from "../actions";

interface PickupRoleConfirmModalProps {
  isOpen: boolean;
  close: () => void;
  userId: number;
  mode: "grant" | "revoke";
}

export default function PickupRoleConfirmModal({
  isOpen,
  close,
  userId,
  mode,
}: PickupRoleConfirmModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isGrant = mode === "grant";

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = isGrant
        ? await grantPickupRoleAction(userId)
        : await revokePickupRoleAction(userId);
      if (result.success) {
        close();
        router.refresh();
      } else {
        setError(result.error ?? "처리에 실패했습니다.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>픽업 권한 {isGrant ? "부여" : "회수"}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          {isGrant
            ? "이 사업자에게 픽업 권한을 부여하시겠습니까?"
            : "이 사업자의 픽업 권한을 회수하시겠습니까?"}
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={close}
            disabled={isPending}
          >
            취소
          </Button>
          <Button
            className={`flex-1 ${isGrant ? "bg-amber-600 hover:bg-amber-700" : ""}`}
            variant={isGrant ? "default" : "destructive"}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "처리 중..." : isGrant ? "부여" : "회수"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
