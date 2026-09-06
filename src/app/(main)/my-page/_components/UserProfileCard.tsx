"use client";

import type { UserSelfResponse } from "@/apis/generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsDesktop } from "@/hooks/use-media-query";
import { Crown, User } from "lucide-react";
import { overlay } from "overlay-kit";
import { hasNaviMembership, hasTalesMembership } from "../_lib/utils";
import PasswordChangeForm from "./PasswordChangeForm";
import ProfileEditForm from "./ProfileEditForm";

interface UserProfileCardProps {
  user: UserSelfResponse;
}

export default function UserProfileCard({ user }: UserProfileCardProps) {
  const isDesktop = useIsDesktop();

  const handleEditProfile = () => {
    overlay.open(({ isOpen, close }) => {
      if (isDesktop) {
        return (
          <Dialog open={isOpen} onOpenChange={close}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>내 정보 수정</DialogTitle>
              </DialogHeader>
              <ProfileEditForm user={user} onClose={close} />
            </DialogContent>
          </Dialog>
        );
      } else {
        return (
          <Drawer open={isOpen} onOpenChange={(open) => !open && close()}>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader>
                <DrawerTitle>내 정보 수정</DrawerTitle>
              </DrawerHeader>
              <div className="overflow-y-auto px-4 pb-4">
                <ProfileEditForm user={user} onClose={close} />
              </div>
            </DrawerContent>
          </Drawer>
        );
      }
    });
  };

  const handleChangePassword = () => {
    overlay.open(({ isOpen, close }) => {
      if (isDesktop) {
        return (
          <Dialog open={isOpen} onOpenChange={close}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>비밀번호 변경</DialogTitle>
              </DialogHeader>
              <PasswordChangeForm onClose={close} />
            </DialogContent>
          </Dialog>
        );
      } else {
        return (
          <Drawer open={isOpen} onOpenChange={(open) => !open && close()} repositionInputs={false}>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader>
                <DrawerTitle>비밀번호 변경</DrawerTitle>
              </DrawerHeader>
              <div className="overflow-y-auto px-4 pb-4">
                <PasswordChangeForm onClose={close} />
              </div>
            </DrawerContent>
          </Drawer>
        );
      }
    });
  };

  return (
    <div className="mb-6 border border-white/10 bg-white/5 p-4 text-white md:mb-8 md:p-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="w-full md:w-auto">
          <div className="mb-2 flex items-center gap-3">
            <User size={28} className="md:size-8" />
            <h2 className="typo-bold-18 md:text-3xl">{user.name}님</h2>
            <button
              onClick={handleEditProfile}
              className="typo-bold-10 border border-white/20 bg-white/10 px-2 py-1 transition-colors hover:bg-white/20 md:px-3 md:py-1.5 md:typo-medium-14"
            >
              내 정보 수정
            </button>
            <button
              onClick={handleChangePassword}
              className="typo-bold-10 border border-white/20 bg-white/10 px-2 py-1 transition-colors hover:bg-white/20 md:px-3 md:py-1.5 md:typo-medium-14"
            >
              비밀번호 변경
            </button>
          </div>
          <p className="typo-medium-14 text-white/90 md:text-base">@{user.username}</p>
          <p className="typo-medium-12 text-white/60 md:typo-medium-14">{user.email}</p>
        </div>
        <div className="w-full md:w-auto md:text-right">
          <div className="mb-2 flex flex-wrap items-center gap-2 md:mb-3 md:gap-3">
            {hasNaviMembership(user.roles) && (
              <div className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 text-gray-900 md:px-3 md:py-1.5">
                <Crown size={14} className="md:size-4" />
                <span className="typo-bold-12">NAVI</span>
              </div>
            )}
            {hasTalesMembership(user.roles) && (
              <div className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 text-gray-900 md:px-3 md:py-1.5">
                <Crown size={14} className="md:size-4" />
                <span className="typo-bold-12">TALES</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
