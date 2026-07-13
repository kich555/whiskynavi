"use client";

import type { AdminUserResponse } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import DateTimePicker from "../../_components/DateTimePicker";
import UserSearchInput from "../../blacklist/_components/UserSearchInput";
import { setPostCreationRestrictionAction } from "../actions";

interface PostRestrictionFormModalProps {
  isOpen: boolean;
  close: () => void;
  user?: AdminUserResponse;
  onSaved: () => void;
}

function defaultPeriod() {
  const startAt = new Date();
  startAt.setSeconds(0, 0);
  const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
  return { startAt: startAt.toISOString(), endAt: endAt.toISOString() };
}

export default function PostRestrictionFormModal({
  isOpen,
  close,
  user: initialUser,
  onSaved,
}: PostRestrictionFormModalProps) {
  const [defaults] = useState(() => defaultPeriod());
  const [selectedUser, setSelectedUser] = useState<AdminUserResponse | undefined>(initialUser);
  const [reason, setReason] = useState(initialUser?.userExt?.postCreationRestrictionReason ?? "");
  const [startAt, setStartAt] = useState(initialUser?.userExt?.postCreationRestrictionStartAt ?? defaults.startAt);
  const [endAt, setEndAt] = useState(initialUser?.userExt?.postCreationRestrictionEndAt ?? defaults.endAt);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!selectedUser?.id) {
      toast.error("사용자를 선택해주세요.");
      return;
    }

    startTransition(async () => {
      const result = await setPostCreationRestrictionAction(selectedUser.id!, { reason, startAt, endAt });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("게시글 작성 제한을 저장했습니다.");
      onSaved();
      close();
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="typo-bold-20">게시글 작성 제한 {initialUser ? "수정" : "추가"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {initialUser ? (
            <div className="space-y-1.5">
              <Label>사용자</Label>
              <div className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700">
                {initialUser.name} ({initialUser.email})
              </div>
            </div>
          ) : (
            <UserSearchInput onSelect={setSelectedUser} onClear={() => setSelectedUser(undefined)} />
          )}

          <div className="space-y-1.5">
            <Label htmlFor="post-restriction-reason">사유 *</Label>
            <Textarea
              id="post-restriction-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="게시글 작성 제한 사유를 입력하세요"
            />
            <p className="text-right text-xs text-gray-400">{reason.length}/1000</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>시작 시각 *</Label>
              <DateTimePicker value={startAt} onChange={setStartAt} required />
            </div>
            <div className="space-y-1.5">
              <Label>종료 시각 *</Label>
              <DateTimePicker value={endAt} onChange={setEndAt} required />
            </div>
          </div>
          <p className="text-xs text-gray-500">제한 기간은 최소 1시간, 최대 9999년입니다.</p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1" onClick={close} disabled={isPending}>
            취소
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
