"use client";

import { deleteBoardPostAction } from "@/app/admin/boards/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface AdminPostDeleteDialogProps {
  boardId: number;
  boardRoute: string;
  postId: number;
}

export default function AdminPostDeleteDialog({ boardId, boardRoute, postId }: AdminPostDeleteDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const handleOpenChange = (open: boolean) => {
    if (isDeleting) return;
    setIsOpen(open);
    if (!open) {
      setDeleteReason("");
      setDeleteError(null);
    }
  };

  const handleDelete = () => {
    const normalizedReason = deleteReason.trim();
    if (!normalizedReason) {
      setDeleteError("삭제 사유를 입력해 주세요.");
      return;
    }

    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteBoardPostAction(boardId, postId, normalizedReason, boardRoute);
      if (!result.success) {
        setDeleteError(result.error ?? "게시글 삭제에 실패했습니다.");
        return;
      }

      router.push(`/board/${boardRoute}`);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
      >
        관리자 삭제
      </button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>관리자 권한으로 게시글 삭제</DialogTitle>
            <DialogDescription>
              게시글은 즉시 노출되지 않게 처리되며, 관리자 정보와 삭제 사유가 감사 기록으로 보존됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="admin-post-delete-reason" className="text-sm font-medium">
              삭제 사유 <span className="text-red-600">*</span>
            </label>
            <Textarea
              id="admin-post-delete-reason"
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
              placeholder="운영 정책 위반 등 삭제 사유를 입력해 주세요."
              maxLength={500}
              disabled={isDeleting}
              aria-invalid={Boolean(deleteError)}
              className="min-h-28 resize-none"
            />
            <div className="flex items-start justify-between gap-3">
              <FormMessage message={deleteError} variant="error" />
              <span className="ml-auto shrink-0 text-xs text-gray-500">{deleteReason.length}/500</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isDeleting}>
              취소
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "삭제 중..." : "게시글 삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
