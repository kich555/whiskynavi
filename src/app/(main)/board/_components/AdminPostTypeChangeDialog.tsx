"use client";

import type { PostTypeResponse } from "@/apis/generated/api";
import { changeBoardPostTypeAction } from "@/app/admin/boards/actions";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

interface AdminPostTypeChangeDialogProps {
  boardId: number;
  boardRoute: string;
  postId: number;
  currentPostTypeId?: number;
  postTypes: PostTypeResponse[];
}

export default function AdminPostTypeChangeDialog({
  boardId,
  boardRoute,
  postId,
  currentPostTypeId,
  postTypes,
}: AdminPostTypeChangeDialogProps) {
  const router = useRouter();
  const selectablePostTypes = useMemo(
    () => postTypes.filter((postType) => postType.id && postType.name && postType.usages?.includes("POST")),
    [postTypes],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPostTypeId, setSelectedPostTypeId] = useState(currentPostTypeId ? String(currentPostTypeId) : "");
  const [changeError, setChangeError] = useState<string | null>(null);
  const [isChanging, startChange] = useTransition();

  const handleOpenChange = (open: boolean) => {
    if (isChanging) return;
    setIsOpen(open);
    setChangeError(null);
    if (open) {
      setSelectedPostTypeId(currentPostTypeId ? String(currentPostTypeId) : "");
    }
  };

  const handleChange = () => {
    const postTypeId = Number(selectedPostTypeId);
    if (!Number.isSafeInteger(postTypeId) || postTypeId <= 0) {
      setChangeError("변경할 분류를 선택해 주세요.");
      return;
    }

    setChangeError(null);
    startChange(async () => {
      const result = await changeBoardPostTypeAction(boardId, postId, postTypeId, boardRoute);
      if (!result.success) {
        setChangeError(result.error ?? "게시글 분류 변경에 실패했습니다.");
        return;
      }

      setIsOpen(false);
      toast.success("게시글 분류를 변경했습니다.");
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        disabled={selectablePostTypes.length === 0}
        className="typo-medium-14 rounded-lg border border-amber-300 px-3 py-1.5 text-amber-600 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        분류 변경
      </button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>게시글 분류 변경</DialogTitle>
            <DialogDescription>이 게시판에서 사용 중인 게시글 분류 중 하나를 선택해 주세요.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="admin-post-type" className="typo-medium-14">
              분류
            </label>
            <Select value={selectedPostTypeId} onValueChange={setSelectedPostTypeId} disabled={isChanging}>
              <SelectTrigger id="admin-post-type" className="w-full">
                <SelectValue placeholder="분류를 선택해 주세요." />
              </SelectTrigger>
              <SelectContent>
                {selectablePostTypes.map((postType) => (
                  <SelectItem key={postType.id} value={String(postType.id)}>
                    {postType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage message={changeError} variant="error" />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isChanging}>
              취소
            </Button>
            <Button
              type="button"
              onClick={handleChange}
              disabled={isChanging || selectedPostTypeId === String(currentPostTypeId ?? "")}
            >
              {isChanging ? "변경 중..." : "분류 변경"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
