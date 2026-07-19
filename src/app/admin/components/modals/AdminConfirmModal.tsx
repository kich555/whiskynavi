"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface AdminConfirmModalProps {
  isOpen: boolean;
  close: () => void;
  userName: string;
  username: string;
  onConfirm: () => void;
}

export default function AdminConfirmModal({ isOpen, close, userName, username, onConfirm }: AdminConfirmModalProps) {
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
            <DialogTitle className="typo-bold-20">관리자 권한 추가</DialogTitle>
          </div>
          <p className="text-gray-700">
            <span className="font-bold text-gray-900">
              {userName}({username})
            </span>{" "}
            회원을
            <br />
            정말로 <span className="font-bold text-red-600">관리자</span>로 등록하시겠습니까?
          </p>
          <p className="typo-medium-14 mt-2 text-red-600">관리자는 모든 회원 정보와 시스템을 관리할 수 있습니다.</p>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1" onClick={close}>
            취소
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleConfirm}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
