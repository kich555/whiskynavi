"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { AdminUserResponse } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserSearchInput from "../../blacklist/_components/UserSearchInput";
import { addMembershipAction } from "../actions";

type MembershipBrand = "navi" | "tales";

interface AddMemberModalProps {
  isOpen: boolean;
  close: () => void;
  brand: MembershipBrand;
}

export default function AddMemberModal({ isOpen, close, brand: initialBrand }: AddMemberModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedUser, setSelectedUser] = useState<AdminUserResponse | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<MembershipBrand>(initialBrand);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedUser) return;

    startTransition(async () => {
      setError(null);
      const result = await addMembershipAction(selectedUser.id!, selectedBrand);
      if (result.success) {
        close();
        router.refresh();
      } else {
        setError(result.error ?? "멤버십 추가에 실패했습니다.");
      }
    });
  };

  const brandLabel = selectedBrand === "navi" ? "위스키내비" : "더 위스키테일즈";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="typo-bold-20">멤버십 추가</DialogTitle>
          <p className="mt-1 typo-medium-14 text-gray-500">사용자를 검색하여 멤버십을 추가합니다.</p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* 브랜드 선택 */}
          <div className="space-y-1.5">
            <label className="typo-medium-14">브랜드 선택 *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedBrand("navi")}
                className={`flex-1 cursor-pointer rounded-lg px-4 py-2.5 typo-medium-14 font-medium transition-colors ${
                  selectedBrand === "navi" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                위스키내비
              </button>
              <button
                type="button"
                onClick={() => setSelectedBrand("tales")}
                className={`flex-1 cursor-pointer rounded-lg px-4 py-2.5 typo-medium-14 font-medium transition-colors ${
                  selectedBrand === "tales" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                더 위스키테일즈
              </button>
            </div>
          </div>

          {/* 사용자 검색 */}
          <UserSearchInput
            onSelect={(user) => {
              setSelectedUser(user);
              setError(null);
            }}
            onClear={() => setSelectedUser(null)}
          />

          {/* 선택된 사용자 정보 요약 */}
          {selectedUser && (
            <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="typo-medium-14 text-gray-900">선택된 사용자</p>
              <div className="grid grid-cols-2 gap-2 typo-medium-14">
                <div>
                  <span className="text-gray-500">이름:</span> <span className="font-medium">{selectedUser.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">닉네임:</span>{" "}
                  <span className="font-medium">@{selectedUser.username}</span>
                </div>
                <div>
                  <span className="text-gray-500">이메일:</span>{" "}
                  <span className="font-medium">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="text-gray-500">추가 멤버십:</span>{" "}
                  <span className="font-medium text-amber-600">{brandLabel}</span>
                </div>
              </div>
            </div>
          )}

          {error && <p className="typo-medium-14 text-red-600">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1" onClick={close}>
            취소
          </Button>
          <Button
            className="flex-1 bg-amber-600 hover:bg-amber-700"
            onClick={handleConfirm}
            disabled={!selectedUser || isPending}
          >
            {isPending ? "추가 중..." : "멤버십 추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
