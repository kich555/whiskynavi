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
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FC, useTransition } from "react";
import { toast } from "sonner";
import { deleteSeriesAction } from "../../actions";

interface Props {
  isOpen: boolean;
  id: number;
  close: () => void;
}

const SeriesDeleteModal: FC<Props> = ({ isOpen, close, id }) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteSeriesAction(id);
      if (result.success) {
        close();
        router.push("/admin/products");
      } else {
        toast.error(result.error || "시리즈 삭제에 실패했습니다.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <DialogTitle className="typo-bold-20">삭제 확인</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-gray-600">
            이 시리즈를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1" onClick={close} disabled={isPending}>
            취소
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={isPending}>
            {isPending ? "삭제 중..." : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SeriesDeleteModal;
