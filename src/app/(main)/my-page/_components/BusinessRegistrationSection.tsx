"use client";

import type { UserBusinessApplicationResponse } from "@/apis/generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsDesktop } from "@/hooks/use-media-query";
import { Building2, CheckCircle, Clock, XCircle } from "lucide-react";
import { overlay } from "overlay-kit";
import { useTransition } from "react";
import { cancelBusinessApplication } from "../actions";
import BusinessApplyForm from "./BusinessApplyForm";
import BusinessApplyHistory from "./BusinessApplyHistory";

interface BusinessRegistrationSectionProps {
  businessApplicationHistory: UserBusinessApplicationResponse[] | null;
}

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  HOUSEHOLD: "가정용",
  ENTERTAINMENT: "유흥용",
};

const formatBusinessType = (application: UserBusinessApplicationResponse & { businessType?: string }): string => {
  const businessType = application.businessType;
  if (!businessType) return "-";
  return BUSINESS_TYPE_LABEL[businessType] ?? businessType;
};

export default function BusinessRegistrationSection({ businessApplicationHistory }: BusinessRegistrationSectionProps) {
  const isDesktop = useIsDesktop();
  const [isPending, startTransition] = useTransition();
  const latestBusinessApplication = businessApplicationHistory?.[0] ?? null;

  const isPendingApplication = latestBusinessApplication?.status === "PENDING";
  const isApprovedApplication = latestBusinessApplication?.status === "APPROVED";

  const handleBusinessRegister = () => {
    overlay.open(({ isOpen, close }) => {
      if (isDesktop) {
        return (
          <Dialog open={isOpen} onOpenChange={close}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>사업자 등록하기</DialogTitle>
              </DialogHeader>
              <BusinessApplyForm onClose={close} />
            </DialogContent>
          </Dialog>
        );
      } else {
        return (
          <Drawer open={isOpen} onOpenChange={(open) => !open && close()}>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader>
                <DrawerTitle>사업자 등록하기</DrawerTitle>
              </DrawerHeader>
              <div className="overflow-y-auto px-4 pb-4">
                <BusinessApplyForm onClose={close} />
              </div>
            </DrawerContent>
          </Drawer>
        );
      }
    });
  };

  const handleBusinessHistory = () => {
    overlay.open(({ isOpen, close }) => {
      if (isDesktop) {
        return (
          <Dialog open={isOpen} onOpenChange={close}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>내 정보 수정</DialogTitle>
              </DialogHeader>
              <BusinessApplyHistory applicationHistory={businessApplicationHistory} />
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
                <BusinessApplyHistory applicationHistory={businessApplicationHistory} />
              </div>
            </DrawerContent>
          </Drawer>
        );
      }
    });
  };

  const handleBusinessCancel = () => {
    if (!latestBusinessApplication?.id) return;

    overlay.open(({ isOpen, close }) => (
      <Dialog open={isOpen} onOpenChange={close}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>사업자 등록 취소</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">사업자 등록 신청을 취소하시겠습니까?</p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={close}
              className="cursor-pointer rounded-md border border-white/10 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5"
            >
              아니요
            </button>
            <button
              onClick={() => {
                close();
                startTransition(async () => {
                  const result = await cancelBusinessApplication(latestBusinessApplication.id!);
                  if (!result.success) {
                    overlay.open(({ isOpen: errOpen, close: errClose }) => (
                      <Dialog open={errOpen} onOpenChange={errClose}>
                        <DialogContent className="max-w-sm">
                          <DialogHeader>
                            <DialogTitle>오류</DialogTitle>
                          </DialogHeader>
                          <p className="text-muted-foreground text-sm">{result.error ?? "취소에 실패했습니다."}</p>
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={errClose}
                              className="cursor-pointer rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
                            >
                              확인
                            </button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ));
                  }
                });
              }}
              className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              취소하기
            </button>
          </div>
        </DialogContent>
      </Dialog>
    ));
  };

  return (
    <div className="mb-6 border border-white/10 bg-white/5 p-4 md:mb-8 md:p-8">
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <h3 className="typo-bold-20 flex items-center gap-2 text-white md:text-2xl">
          <Building2 size={24} className="text-white md:size-7" />
          사업자 등록
        </h3>
      </div>
      <div className="space-y-3 md:space-y-4">
        <p className="text-sm text-gray-400 md:text-base">
          사업자로 등록하시면 위스키 픽업 서비스 및 비즈니스 전용 혜택을 받으실 수 있습니다.
        </p>
        {isPendingApplication ? (
          <div className="flex gap-3">
            <button
              onClick={handleBusinessCancel}
              disabled={isPending}
              className="border border-red-600/30 bg-red-600/20 px-6 py-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50 md:text-base"
            >
              사업자 등록 취소하기
            </button>
            <button
              onClick={handleBusinessHistory}
              className="border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20 md:text-base"
            >
              신청내역보기
            </button>
          </div>
        ) : isApprovedApplication ? (
          <button
            onClick={handleBusinessHistory}
            className="border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20 md:text-base"
          >
            신청내역보기
          </button>
        ) : (
          <button
            onClick={handleBusinessRegister}
            className="typo-bold-14 cursor-pointer bg-white px-6 py-3 text-gray-900 transition-colors hover:bg-gray-100 md:text-base"
          >
            사업자 등록하기
          </button>
        )}
      </div>

      {/* 신청 상태 표시 */}
      {latestBusinessApplication && (
        <div className="mt-4 border border-white/10 p-4 md:p-6">
          <div className="mb-3 flex items-start gap-3">
            {latestBusinessApplication.status === "PENDING" && (
              <Clock className="mt-0.5 flex-shrink-0 text-yellow-400" size={20} />
            )}
            {latestBusinessApplication.status === "APPROVED" && (
              <CheckCircle className="mt-0.5 flex-shrink-0 text-green-400" size={20} />
            )}
            {latestBusinessApplication.status === "REJECTED" && (
              <XCircle className="mt-0.5 flex-shrink-0 text-red-400" size={20} />
            )}
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <h4 className="text-sm font-bold text-white md:text-base">{latestBusinessApplication.businessName}</h4>
                <span
                  className={`px-2 py-0.5 text-xs font-semibold ${
                    latestBusinessApplication.status === "PENDING"
                      ? "border border-yellow-600/30 bg-yellow-600/20 text-yellow-400"
                      : latestBusinessApplication.status === "APPROVED"
                        ? "border border-green-600/30 bg-green-600/20 text-green-400"
                        : "border border-red-600/30 bg-red-600/20 text-red-400"
                  }`}
                >
                  {latestBusinessApplication.status === "PENDING"
                    ? "심사중"
                    : latestBusinessApplication.status === "APPROVED"
                      ? "승인완료"
                      : "거부됨"}
                </span>
              </div>
              <div className="space-y-1 text-xs text-gray-400 md:text-sm">
                <p>사업자 등록번호: {latestBusinessApplication.businessRegistrationNumber}</p>
                <p>사업자 구분: {formatBusinessType(latestBusinessApplication)}</p>
                <p>대표자: {latestBusinessApplication.representativeName}</p>
                <p>연락처: {latestBusinessApplication.contact}</p>
                {latestBusinessApplication.pickupAddress && <p>픽업 주소: {latestBusinessApplication.pickupAddress}</p>}
                <p>신청일: {latestBusinessApplication.createdAt}</p>
                {latestBusinessApplication.status === "REJECTED" && latestBusinessApplication.rejectReason && (
                  <p className="mt-2 text-red-400">거부 사유: {latestBusinessApplication.rejectReason}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
