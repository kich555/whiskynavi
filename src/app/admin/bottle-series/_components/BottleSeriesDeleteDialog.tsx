"use client";

import type { AdminBottleSeriesResponse } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteBottleSeriesAction } from "../actions";

interface BottleSeriesDeleteDialogProps {
  open: boolean;
  series: AdminBottleSeriesResponse;
  onOpenChange: (open: boolean) => void;
}

export default function BottleSeriesDeleteDialog({ open, series, onOpenChange }: BottleSeriesDeleteDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (series.id == null) return;
    startTransition(async () => {
      setError(null);
      const result = await deleteBottleSeriesAction(series.id!);
      if (!result.success) {
        setError(result.error ?? "보틀 시리즈 삭제에 실패했습니다.");
        return;
      }
      toast.success("보틀 시리즈를 삭제했습니다.");
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isPending && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <DialogTitle className="typo-bold-20">보틀 시리즈 삭제</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-gray-600">
            <strong className="text-gray-900">
              {series.brand} {series.series}
            </strong>
            을(를) 삭제하시겠습니까? 삭제한 정보는 복구할 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p role="alert" className="typo-medium-14 rounded-lg border border-red-200 bg-red-50 p-3 text-red-600">
            {error}
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            취소
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "삭제 중..." : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
