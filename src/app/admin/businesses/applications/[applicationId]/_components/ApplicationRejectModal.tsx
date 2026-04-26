"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { rejectApplicationAction } from "../actions";

interface ApplicationRejectModalProps {
  isOpen: boolean;
  close: () => void;
  applicationId: number;
}

export default function ApplicationRejectModal({
  isOpen,
  close,
  applicationId,
}: ApplicationRejectModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectReason, setRejectReason] = useState("");
  const [adminMemo, setAdminMemo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setError("반려 사유를 입력해주세요.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await rejectApplicationAction(applicationId, {
        rejectReason,
        adminMemo: adminMemo.trim() || undefined,
      });
      if (result.success) {
        close();
        router.refresh();
      } else {
        setError(result.error ?? "반려에 실패했습니다.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>사업자 신청 반려</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="rejectReason">반려 사유 *</Label>
            <Textarea
              id="rejectReason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="신청자에게 노출되는 반려 사유를 입력하세요."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adminMemo">내부 메모 (선택)</Label>
            <Textarea
              id="adminMemo"
              value={adminMemo}
              onChange={(e) => setAdminMemo(e.target.value)}
              rows={2}
              placeholder="신청자에게 노출되지 않는 내부 메모입니다."
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
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
            variant="destructive"
            className="flex-1"
            onClick={handleReject}
            disabled={isPending}
          >
            {isPending ? "처리 중..." : "반려"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
