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
import { approveApplicationAction } from "../actions";

interface ApplicationApproveModalProps {
  isOpen: boolean;
  close: () => void;
  applicationId: number;
}

export default function ApplicationApproveModal({
  isOpen,
  close,
  applicationId,
}: ApplicationApproveModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      const result = await approveApplicationAction(applicationId);
      if (result.success) {
        close();
        router.refresh();
      } else {
        setError(result.error ?? "승인에 실패했습니다.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>사업자 신청 승인</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          이 신청을 승인하시겠습니까? 승인 후 사업자 역할이 부여됩니다.
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
            className="flex-1 bg-amber-600 hover:bg-amber-700"
            onClick={handleApprove}
            disabled={isPending}
          >
            {isPending ? "처리 중..." : "승인"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
