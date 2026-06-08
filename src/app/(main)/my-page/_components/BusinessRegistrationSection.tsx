"use client";

import type { UserBusinessApplicationOverviewResponse, UserBusinessApplicationResponse } from "@/apis/generated/api";
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
  businessApplicationOverview: UserBusinessApplicationOverviewResponse | null;
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

const getStatusLabel = (status?: string): string => {
  if (status === "PENDING") return "심사중";
  if (status === "APPROVED") return "승인완료";
  if (status === "CANCELED") return "취소됨";
  return "거부됨";
};

const getStatusBadgeClass = (status?: string): string => {
  if (status === "PENDING") return "border border-yellow-600/30 bg-yellow-600/20 text-yellow-400";
  if (status === "APPROVED") return "border border-green-600/30 bg-green-600/20 text-green-400";
  if (status === "CANCELED") return "border border-gray-500/30 bg-gray-500/20 text-gray-300";
  return "border border-red-600/30 bg-red-600/20 text-red-400";
};

const getStatusIcon = (status?: string) => {
  if (status === "PENDING") return <Clock className="mt-0.5 shrink-0 text-yellow-400" size={18} />;
  if (status === "APPROVED") return <CheckCircle className="mt-0.5 shrink-0 text-green-400" size={18} />;
  return <XCircle className="mt-0.5 shrink-0 text-red-400" size={18} />;
};

export default function BusinessRegistrationSection({ businessApplicationOverview }: BusinessRegistrationSectionProps) {
  const isDesktop = useIsDesktop();
  const [isPending, startTransition] = useTransition();
  const latestBusinessApplication = businessApplicationOverview?.latestApplication ?? null;
  const pendingBusinessApplications = businessApplicationOverview?.pendingApplications ?? [];
  const businessApplicationHistory = businessApplicationOverview?.recentApplications ?? null;
  const visibleBusinessApplications =
    pendingBusinessApplications.length > 0
      ? pendingBusinessApplications
      : latestBusinessApplication
        ? [latestBusinessApplication]
        : [];

  const hasPendingApplication = pendingBusinessApplications.length > 0;
  const hasBusinessApplicationHistory = businessApplicationOverview?.hasHistory ?? false;

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

  const handleBusinessCancel = (application: UserBusinessApplicationResponse) => {
    if (!application.id) return;

    overlay.open(({ isOpen, close }) => (
      <Dialog open={isOpen} onOpenChange={close}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>사업자 등록 취소</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            {application.businessName} 사업자 등록 신청을 취소하시겠습니까?
          </p>
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
                  const result = await cancelBusinessApplication(application.id!);
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
    <div className="mb-5 border border-white/10 bg-white/5 p-4 md:mb-6 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <Building2 size={20} className="text-white" />
          사업자 등록
        </h3>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-gray-400">
          사업자로 등록하시면 위스키 픽업 서비스 및 비즈니스 전용 혜택을 받으실 수 있습니다.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleBusinessRegister}
            className="cursor-pointer bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
          >
            {hasBusinessApplicationHistory ? "새 사업자 등록" : "사업자 등록하기"}
          </button>
          {hasBusinessApplicationHistory && (
            <button
              onClick={handleBusinessHistory}
              className="border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
            >
              신청내역보기
            </button>
          )}
        </div>
      </div>

      {visibleBusinessApplications.length > 0 && (
        <div className="mt-3 space-y-2">
          {hasPendingApplication && (
            <p className="text-xs font-semibold text-gray-300">진행 중인 신청 {pendingBusinessApplications.length}건</p>
          )}
          {visibleBusinessApplications.map((application) => (
            <div key={application.id ?? application.businessName} className="border border-white/10 p-3">
              <div className="flex items-start gap-2.5">
                {getStatusIcon(application.status)}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate text-sm font-semibold text-white">{application.businessName}</h4>
                    <span className={`px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(application.status)}`}>
                      {getStatusLabel(application.status)}
                    </span>
                    {application.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => handleBusinessCancel(application)}
                        disabled={isPending}
                        className="ml-auto border border-red-600/30 bg-red-600/10 px-2.5 py-1 text-xs font-semibold text-red-300 transition-colors hover:bg-red-600/20 disabled:opacity-50"
                      >
                        사업자 등록 취소하기
                      </button>
                    )}
                  </div>
                  <div className="mt-2 grid gap-x-4 gap-y-1 text-xs text-gray-400 md:grid-cols-2">
                    <p>사업자 등록번호: {application.businessRegistrationNumber}</p>
                    <p>사업자 구분: {formatBusinessType(application)}</p>
                    <p>대표자: {application.representativeName}</p>
                    <p>연락처: {application.contact}</p>
                    {application.pickupAddress && <p className="md:col-span-2">픽업 주소: {application.pickupAddress}</p>}
                    <p>신청일: {application.createdAt}</p>
                  </div>
                  {application.status === "REJECTED" && application.rejectReason && (
                    <p className="mt-2 text-xs text-red-400">거부 사유: {application.rejectReason}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
