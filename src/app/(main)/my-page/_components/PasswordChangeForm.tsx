"use client";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState, useEffect, useState } from "react";
import { changePassword } from "../actions";

interface PasswordChangeFormProps {
  onClose: () => void;
}

export default function PasswordChangeForm({ onClose }: PasswordChangeFormProps) {
  const [pwState, pwAction, pwPending] = useActionState(changePassword, {
    success: false,
  });

  useEffect(() => {
    if (pwState.success) {
      onClose();
    }
  }, [pwState.success, onClose]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordMatch = !confirmPassword || newPassword === confirmPassword;

  return (
    <form action={pwAction}>
      <div className="space-y-3 md:space-y-4">
        <div>
          <Label className="typo-bold-14 mb-2 block text-gray-700">현재 비밀번호</Label>
          <Input
            name="currentPassword"
            type="password"
            placeholder="현재 비밀번호를 입력하세요"
            className="typo-medium-14 md:text-base"
          />
        </div>
        <div>
          <Label className="typo-bold-14 mb-2 block text-gray-700">새 비밀번호</Label>
          <Input
            name="newPassword"
            type="password"
            placeholder="새 비밀번호를 입력하세요"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="typo-medium-14 md:text-base"
          />
        </div>
        <div>
          <Label className="typo-bold-14 mb-2 block text-gray-700">새 비밀번호 확인</Label>
          <Input
            name="confirmPassword"
            type="password"
            placeholder="새 비밀번호를 다시 입력하세요"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`typo-medium-14 md:text-base ${!passwordMatch ? "border-red-500 focus:ring-red-600" : ""}`}
          />
          {!passwordMatch && <p className="typo-medium-12 mt-1 text-red-600">비밀번호가 일치하지 않습니다</p>}
        </div>
      </div>

      <FormMessage message={pwState.error} className="mt-3" />
      <FormMessage
        message={pwState.success ? "비밀번호가 변경되었습니다." : undefined}
        variant="success"
        className="mt-3"
      />

      <div className="mt-4 flex gap-3">
        <Button type="submit" disabled={pwPending || !passwordMatch}>
          {pwPending ? "변경 중..." : "비밀번호 변경"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          취소
        </Button>
      </div>
    </form>
  );
}
