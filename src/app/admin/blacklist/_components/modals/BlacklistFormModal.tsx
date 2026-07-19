"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import DateTimePicker from "../../../_components/DateTimePicker";
import { useBlacklistForm } from "../hooks/useBlacklistForm";
import UserSearchInput from "../UserSearchInput";

type BlacklistFormData = {
  reason: string;
  startAt: string;
  endAt: string | null;
  userId: number;
  name: string;
};

type BlacklistFormModalProps = {
  isOpen: boolean;
  close: () => void;
  mode: "add" | "edit";
  initialData?: BlacklistFormData;
  onSubmit: (data: BlacklistFormData) => void | Promise<void>;
};

export default function BlacklistFormModal({ isOpen, close, mode, initialData, onSubmit }: BlacklistFormModalProps) {
  const { formState, dispatch, isPending, handleSubmit } = useBlacklistForm({
    mode,
    initialData,
    onSubmit,
  });

  const isAdd = mode === "add";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="typo-bold-20">블랙리스트 {isAdd ? "추가" : "수정"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isAdd && (
            <UserSearchInput
              onSelect={(user) =>
                dispatch({
                  type: "SET_USER",
                  payload: {
                    userId: user.id!.toString(),
                    name: user.name ?? "",
                  },
                })
              }
              onClear={() => dispatch({ type: "CLEAR_USER" })}
            />
          )}

          {!isAdd && (
            <div className="space-y-1.5">
              <Label>이름</Label>
              <div className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700">
                {formState.name}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reason">사유 *</Label>
            <Textarea
              id="reason"
              value={formState.reason}
              onChange={(e) => dispatch({ type: "SET_REASON", payload: e.target.value })}
              rows={3}
              placeholder="제재 사유 입력"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>시작일</Label>
              <DateTimePicker
                value={formState.startAt}
                onChange={(iso) => dispatch({ type: "SET_START_DATE", payload: iso })}
                placeholder="시작일 선택"
              />
            </div>
            <div className="space-y-1.5">
              <Label>종료일</Label>
              {formState.isPermanent ? (
                <div className="typo-medium-14 flex h-9 w-full items-center rounded-md border bg-gray-100 px-3 py-2 text-gray-500">
                  영구 제재
                </div>
              ) : (
                <DateTimePicker
                  value={formState.endAt ?? undefined}
                  onChange={(iso) => dispatch({ type: "SET_END_DATE", payload: iso })}
                  placeholder="종료일 선택"
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="permanent"
              checked={formState.isPermanent}
              onCheckedChange={(checked) =>
                dispatch({
                  type: "TOGGLE_PERMANENT",
                  payload: checked,
                })
              }
            />
            <Label htmlFor="permanent">영구 제재</Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1" onClick={close}>
            취소
          </Button>
          <Button
            variant={isAdd ? "destructive" : "default"}
            className="flex-1"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? "처리 중..." : isAdd ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
