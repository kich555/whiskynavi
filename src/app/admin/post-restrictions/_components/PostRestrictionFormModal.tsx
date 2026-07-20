"use client";

import type { AdminUserResponse } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import DateTimePicker from "../../_components/DateTimePicker";
import UserSearchInput from "../../blacklist/_components/UserSearchInput";
import { setPostCreationRestrictionAction } from "../actions";
import { usePostRestrictionForm, type PostRestrictionFormData } from "./hooks/usePostRestrictionForm";

interface PostRestrictionFormModalProps {
  isOpen: boolean;
  close: () => void;
  user?: AdminUserResponse;
  onSaved: () => void;
}

function toInitialData(user?: AdminUserResponse): PostRestrictionFormData | undefined {
  if (!user?.id) return undefined;
  return {
    userId: user.id,
    name: user.name ?? "",
    reason: user.userExt?.postCreationRestrictionReason ?? "",
    startAt: user.userExt?.postCreationRestrictionStartAt ?? "",
    endAt: user.userExt?.postCreationRestrictionEndAt ?? "",
  };
}

export default function PostRestrictionFormModal({
  isOpen,
  close,
  user: initialUser,
  onSaved,
}: PostRestrictionFormModalProps) {
  const { formState, dispatch, isPending, handleSubmit } = usePostRestrictionForm({
    initialData: toInitialData(initialUser),
    onSubmit: async (data) => {
      const result = await setPostCreationRestrictionAction(data.userId, {
        reason: data.reason,
        startAt: data.startAt,
        endAt: data.endAt,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("게시글 작성 제한을 저장했습니다.");
      onSaved();
      close();
    },
  });

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
            <UserSearchInput
              onSelect={(user) =>
                dispatch({
                  type: "SET_USER",
                  payload: { userId: String(user.id ?? ""), name: user.name ?? "" },
                })
              }
              onClear={() => dispatch({ type: "CLEAR_USER" })}
            />
          )}

          <div className="space-y-1.5">
            <Label htmlFor="post-restriction-reason">사유 *</Label>
            <Textarea
              id="post-restriction-reason"
              value={formState.reason}
              onChange={(event) => dispatch({ type: "SET_REASON", payload: event.target.value })}
              rows={4}
              maxLength={1000}
              placeholder="게시글 작성 제한 사유를 입력하세요"
            />
            <p className="text-right typo-medium-12 text-gray-400">{formState.reason.length}/1000</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>시작 시각 *</Label>
              <DateTimePicker
                value={formState.startAt}
                onChange={(value) => dispatch({ type: "SET_START_DATE", payload: value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>종료 시각 *</Label>
              <DateTimePicker
                value={formState.endAt}
                onChange={(value) => dispatch({ type: "SET_END_DATE", payload: value })}
                required
              />
            </div>
          </div>
          <p className="typo-medium-12 text-gray-500">제한 기간은 최소 1시간, 최대 9999년입니다.</p>
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
