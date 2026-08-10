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
import { Switch } from "@/components/ui/switch";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { autoConfirmApplicationsAction } from "../../actions";

interface ApplicationAutoConfirmModalProps {
  isOpen: boolean;
  close: () => void;
  noticeId: number;
}

export default function ApplicationAutoConfirmModal({ isOpen, close, noticeId }: ApplicationAutoConfirmModalProps) {
  const [applySeriesPurchasePriority, setApplySeriesPurchasePriority] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAutoConfirm = () => {
    startTransition(async () => {
      const result = await autoConfirmApplicationsAction(noticeId, applySeriesPurchasePriority);

      if (result.success) {
        const confirmedCount = result.data?.confirmedApplicationCount ?? 0;
        const rejectedCount = result.data?.rejectedApplicationCount ?? 0;

        toast.success(`자동 승인배정 완료: 확정 ${confirmedCount}건, 거절 ${rejectedCount}건`);
        close();
        router.refresh();
      } else {
        toast.error(result.error || "자동 승인배정에 실패했습니다.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Sparkles size={24} className="text-amber-600" />
            </div>
            <DialogTitle>우선순위최대다수최대행복배정</DialogTitle>
          </div>
          <DialogDescription>
            이 공고의 대기 중 예약 신청을 자동 승인배정합니다. 처리 후 신청 상태와 확정 수량이 즉시 변경됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="space-y-1">
            <label htmlFor="series-purchase-priority" className="typo-medium-14 text-gray-900">
              시리즈 구매 다양성 우선 적용
            </label>
            <p className="typo-regular-12 text-gray-600">
              같은 브랜드·시리즈에서 구매한 보틀 종류 수를 커뮤니티보다 먼저 비교합니다.
            </p>
          </div>
          <Switch
            id="series-purchase-priority"
            checked={applySeriesPurchasePriority}
            onCheckedChange={setApplySeriesPurchasePriority}
            disabled={isPending}
            aria-label="시리즈 구매 다양성 우선 적용"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={isPending}>
            취소
          </Button>
          <Button
            onClick={handleAutoConfirm}
            disabled={isPending}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            {isPending ? "처리 중..." : "자동 승인배정"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
