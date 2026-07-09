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
import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { rejectPendingApplicationsAction } from "../../actions";

interface ApplicationBulkRejectModalProps {
  isOpen: boolean;
  close: () => void;
  noticeId: number;
  pendingApplicationCount: number;
}

export default function ApplicationBulkRejectModal({
  isOpen,
  close,
  noticeId,
  pendingApplicationCount,
}: ApplicationBulkRejectModalProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectPendingApplicationsAction(noticeId);
      if (result.success) {
        const rejectedCount = result.data?.rejectedApplicationCount ?? 0;
        toast.success(`미처리 신청 ${rejectedCount}건을 거절했습니다.`);
        close();
        router.refresh();
        return;
      }

      toast.error(result.error || "미처리 신청 일괄 거절에 실패했습니다.");
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle size={24} className="text-red-600" />
            </div>
            <DialogTitle>미처리 신청 일괄 거절</DialogTitle>
          </div>
          <DialogDescription>아직 확정되지 않은 신청 {pendingApplicationCount}건을 거절 처리합니다.</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={isPending}>
            취소
          </Button>
          <Button onClick={handleReject} disabled={isPending} className="bg-red-600 text-white hover:bg-red-700">
            {isPending ? "처리 중..." : "거절"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
