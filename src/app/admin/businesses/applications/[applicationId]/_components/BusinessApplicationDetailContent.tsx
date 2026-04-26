"use client";

import type {
  AdminBusinessApplicationAuditLogResponse,
  AdminBusinessApplicationResponse,
} from "@/apis/generated/api";
import AdminHeader from "../../../../_components/AdminHeader";
import { useSidebar } from "../../../../_components/AdminLayoutClient";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { overlay } from "overlay-kit";
import { useRouter } from "next/navigation";
import ApplicationApproveModal from "./ApplicationApproveModal";
import ApplicationRejectModal from "./ApplicationRejectModal";

const APPLICATION_STATUS_LABEL: Record<string, string> = {
  PENDING: "검토중",
  APPROVED: "승인",
  REJECTED: "반려",
  CANCELED: "취소",
};

const APPLICATION_STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELED: "bg-gray-100 text-gray-700",
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
};

interface BusinessApplicationDetailContentProps {
  application: AdminBusinessApplicationResponse;
  auditLogs: AdminBusinessApplicationAuditLogResponse[];
}

export default function BusinessApplicationDetailContent({
  application,
  auditLogs,
}: BusinessApplicationDetailContentProps) {
  const router = useRouter();
  const { toggle } = useSidebar();

  const isPending = application.status === "PENDING";

  const handleApprove = () => {
    overlay.open((props) => (
      <ApplicationApproveModal
        {...props}
        applicationId={application.id!}
      />
    ));
  };

  const handleReject = () => {
    overlay.open((props) => (
      <ApplicationRejectModal
        {...props}
        applicationId={application.id!}
      />
    ));
  };

  return (
    <>
      <AdminHeader
        title="사업자 신청 상세"
        onToggleSidebar={toggle}
        showSearch={false}
      />

      <div className="p-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/admin/businesses/applications")}
            className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            신청 목록으로 돌아가기
          </button>
          {isPending && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApprove}
                className="typo-medium-14 flex cursor-pointer items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-white transition-colors hover:bg-amber-700"
              >
                <CheckCircle size={14} />
                승인
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="typo-medium-14 flex cursor-pointer items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-white transition-colors hover:bg-red-700"
              >
                <XCircle size={14} />
                반려
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* 신청 상태 */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">신청 정보</h3>
                <Badge
                  className={
                    APPLICATION_STATUS_COLOR[application.status ?? ""] ??
                    "bg-gray-100 text-gray-700"
                  }
                >
                  {APPLICATION_STATUS_LABEL[application.status ?? ""] ??
                    application.status}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 p-6 md:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">신청 ID</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.id}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">신청자 ID</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.userId ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">신청일</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(application.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">수정일</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(application.updatedAt)}
                </p>
              </div>
              {application.rejectReason && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">반려 사유</p>
                  <p className="text-sm font-medium text-red-600">
                    {application.rejectReason}
                  </p>
                </div>
              )}
              {application.adminMemo && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">관리자 메모</p>
                  <p className="text-sm font-medium text-gray-900">
                    {application.adminMemo}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 사업자 정보 */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="font-bold text-gray-900">사업자 정보</h3>
            </div>
            <div className="grid grid-cols-2 gap-6 p-6 md:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">업체명</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.businessName ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">사업자등록번호</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.businessRegistrationNumber ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">대표자명</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.representativeName ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">연락처</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.contact ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">개업일</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.openingDate ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">과세유형</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.taxType ?? "-"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">픽업 주소</p>
                <p className="text-sm font-medium text-gray-900">
                  {application.pickupAddress ?? "-"}
                </p>
              </div>
              {application.documentDownloadUrl && (
                <div>
                  <p className="text-xs text-gray-500">사업자등록증</p>
                  <a
                    href={application.documentDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-amber-600 hover:underline"
                  >
                    {application.documentOriginalFilename ?? "다운로드"}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* 처리 이력 */}
          {auditLogs.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h3 className="font-bold text-gray-900">처리 이력</h3>
              </div>
              <div className="divide-y divide-gray-100 p-6">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {APPLICATION_STATUS_LABEL[log.beforeStatus ?? ""] ??
                            log.beforeStatus ??
                            "-"}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-sm font-medium text-amber-600">
                          {APPLICATION_STATUS_LABEL[log.afterStatus ?? ""] ??
                            log.afterStatus ??
                            "-"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    {log.actorUsername && (
                      <p className="mt-1 text-xs text-gray-500">
                        처리자: {log.actorUsername}
                      </p>
                    )}
                    {log.memo && (
                      <p className="mt-1 text-xs text-gray-500">
                        메모: {log.memo}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
