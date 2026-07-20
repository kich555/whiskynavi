"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface RemoveMemberConfirmModalProps {
  isOpen: boolean;
  close: () => void;
  userName: string;
  username: string;
  onConfirm: () => void;
}

export default function RemoveMemberConfirmModal({
  isOpen,
  close,
  userName,
  username,
  onConfirm,
}: RemoveMemberConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <DialogTitle className="typo-bold-20">멤버십 해제</DialogTitle>
          </div>
          <p className="text-gray-700">
            <span className="font-bold text-gray-900">
              {userName}(@{username})
            </span>{" "}
            회원의 멤버십을 정말로 <span className="font-bold text-red-600">해제</span>하시겠습니까?
          </p>
          <p className="mt-2 typo-medium-14 text-gray-500">해제된 멤버십은 다시 추가할 수 있습니다.</p>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1" onClick={close}>
            취소
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleConfirm}>
            해제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
