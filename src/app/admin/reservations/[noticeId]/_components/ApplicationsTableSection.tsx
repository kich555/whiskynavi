"use client";

import type {
  AdminBottleReservationApplicationResponse,
  GetApiAdminBottlesReservationsApplicationsRole,
  GetApiAdminBottlesReservationsApplicationsStatus,
} from "@/apis/generated/api";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeWithMilliseconds } from "@/lib/formatters";
import { Ban, Check, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import Pagination from "../../../_components/Pagination";
import { RESERVATION_STATUS_COLOR, RESERVATION_STATUS_LABEL, ROLE_LABEL_MAP } from "../../../constants";
import ApplicationAutoConfirmModal from "./ApplicationAutoConfirmModal";
import ApplicationBulkRejectModal from "./ApplicationBulkRejectModal";
import ApplicationCancelModal from "./ApplicationCancelModal";
import ApplicationConfirmModal from "./ApplicationConfirmModal";
import ApplicationRejectModal from "./ApplicationRejectModal";
import ReservationAllocationExcelSection from "./ReservationAllocationExcelSection";

const APPLICATION_STATUS_OPTIONS: GetApiAdminBottlesReservationsApplicationsStatus[] = [
  "APPLIED",
  "CANCELLED",
  "CONFIRMED",
  "PAYMENT_COMPLETED",
  "WAITING_PICKUP",
  "RECEIVED",
  "REJECTED",
];

const APPLICATION_ROLE_OPTIONS: GetApiAdminBottlesReservationsApplicationsRole[] = [
  "ROLE_GUEST",
  "ROLE_USER",
  "ROLE_ADMIN",
  "ROLE_SUPER_ADMIN",
  "ROLE_CONSUMER",
  "ROLE_WHISKYNAVI_MEMBER",
  "ROLE_WHISKYTALES_MEMBER",
  "ROLE_BLIND_MEMBER",
  "ROLE_BUSINESS",
  "ROLE_TRAILNTALE_BUSINESS",
  "ROLE_COMMUNITY_BUSINESS",
  "ROLE_PICK_UP_BUSINESS",
];

const hasRole = (roles: string[] | undefined, role: string): boolean => roles?.includes(role) ?? false;

function CommunityRoleBadge({ active, className, label }: { active: boolean; className: string; label: string }) {
  if (!active) {
    return <span className="text-gray-400">-</span>;
  }

  return <Badge className={className}>{label}</Badge>;
}

interface ApplicationsTableSectionProps {
  noticeId: number;
  applications: AdminBottleReservationApplicationResponse[];
  totalElements: number;
  currentPage: number;
  itemsPerPage: number;
  pendingApplicationCount: number;
  currentRole?: GetApiAdminBottlesReservationsApplicationsRole;
  currentStatus?: GetApiAdminBottlesReservationsApplicationsStatus;
}

export default function ApplicationsTableSection({
  noticeId,
  applications,
  totalElements,
  currentPage,
  itemsPerPage,
  pendingApplicationCount,
  currentRole,
  currentStatus,
}: ApplicationsTableSectionProps) {
  const router = useRouter();

  const handleConfirm = (app: AdminBottleReservationApplicationResponse) => {
    overlay.open((props) => (
      <ApplicationConfirmModal
        {...props}
        applicationId={app.id!}
        applicantName={app.applicantUser?.name ?? "알 수 없음"}
        requestedQuantity={app.quantity ?? 1}
        initialQuantity={app.confirmedQuantity ?? app.quantity ?? 1}
        mode={app.status === "CONFIRMED" ? "edit" : "confirm"}
      />
    ));
  };

  const handleReject = (app: AdminBottleReservationApplicationResponse) => {
    overlay.open((props) => (
      <ApplicationRejectModal
        {...props}
        applicationId={app.id!}
        applicantName={app.applicantUser?.name ?? "알 수 없음"}
      />
    ));
  };

  const handleCancel = (app: AdminBottleReservationApplicationResponse) => {
    overlay.open((props) => (
      <ApplicationCancelModal
        {...props}
        applicationId={app.id!}
        applicantName={app.applicantUser?.name ?? "알 수 없음"}
      />
    ));
  };

  const handleAutoConfirm = () => {
    overlay.open((props) => <ApplicationAutoConfirmModal {...props} noticeId={noticeId} />);
  };

  const handleBulkReject = () => {
    overlay.open((props) => (
      <ApplicationBulkRejectModal {...props} noticeId={noticeId} pendingApplicationCount={pendingApplicationCount} />
    ));
  };

  const handleFilterChange = (key: "role" | "status", value: string) => {
    const params = new URLSearchParams();

    params.set("page", "1");
    params.set("limit", String(itemsPerPage));

    if (currentRole) {
      params.set("role", currentRole);
    }

    if (currentStatus) {
      params.set("status", currentStatus);
    }

    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.push(`/admin/reservations/${noticeId}?${params.toString()}`);
  };

  const canConfirm = (status?: string) => status === "APPLIED" || status === "CONFIRMED";
  const canReject = (status?: string) => status === "APPLIED";
  const canCancel = (status?: string) => status === "CONFIRMED" || status === "WAITING_PICKUP";
  const hasPendingApplications = pendingApplicationCount > 0;
  const paginationSearchParams = {
    limit: String(itemsPerPage),
    role: currentRole,
    status: currentStatus,
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-bold text-gray-900">
              신청 목록 <span className="typo-regular-14 text-gray-500">({totalElements}건)</span>
            </h3>
            <p className="mt-1 text-xs text-gray-500">미처리 신청 {pendingApplicationCount}건</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={currentStatus ?? "all"}
              onChange={(event) => handleFilterChange("status", event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              aria-label="신청 상태 필터"
            >
              <option value="all">상태 전체</option>
              {APPLICATION_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {RESERVATION_STATUS_LABEL[status] ?? status}
                </option>
              ))}
            </select>
            <select
              value={currentRole ?? "all"}
              onChange={(event) => handleFilterChange("role", event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              aria-label="신청자 권한 필터"
            >
              <option value="all">권한 전체</option>
              {APPLICATION_ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL_MAP[role] ?? role}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAutoConfirm}
              disabled={!hasPendingApplications}
              className="typo-medium-14 flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
              title={!hasPendingApplications ? "자동 승인배정할 미처리 신청이 없습니다." : undefined}
            >
              <Sparkles size={14} />
              우선순위최대다수최대행복배정
            </button>
            <button
              type="button"
              onClick={handleBulkReject}
              disabled={!hasPendingApplications}
              className="typo-medium-14 flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
              title={!hasPendingApplications ? "거절할 미처리 신청이 없습니다." : undefined}
            >
              <X size={14} />
              미처리 신청 일괄 거절
            </button>
          </div>
        </div>
      </div>

      <ReservationAllocationExcelSection noticeId={noticeId} />

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">ID</th>
              <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">신청자</th>
              <th className="typo-bold-12 px-4 py-3 text-center text-gray-700 uppercase">내비 커뮤</th>
              <th className="typo-bold-12 px-4 py-3 text-center text-gray-700 uppercase">테일즈 커뮤</th>
              <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">연락처</th>
              <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">픽업 업장</th>
              <th className="typo-bold-12 px-4 py-3 text-center text-gray-700 uppercase">신청수량</th>
              <th className="typo-bold-12 px-4 py-3 text-center text-gray-700 uppercase">확정수량</th>
              <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">상태</th>
              <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">예약신청시각</th>
              <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                  신청 내역이 없습니다.
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{app.id}</td>
                  <td className="typo-medium-14 px-4 py-3 text-gray-900">{app.applicantUser?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-center text-sm">
                    <CommunityRoleBadge
                      active={hasRole(app.applicantUser?.roles, "ROLE_WHISKYNAVI_MEMBER")}
                      className="bg-amber-100 text-amber-700"
                      label="내비"
                    />
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <CommunityRoleBadge
                      active={hasRole(app.applicantUser?.roles, "ROLE_WHISKYTALES_MEMBER")}
                      className="bg-blue-100 text-blue-700"
                      label="테일즈"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{app.applicantUser?.phone ?? "-"}</td>
                  <td className="max-w-[160px] truncate px-4 py-3 text-sm text-gray-600">
                    {app.pickupBusiness?.businessName ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-900">{app.quantity}</td>
                  <td className="typo-medium-14 px-4 py-3 text-center text-amber-600">
                    {app.confirmedQuantity ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge className={RESERVATION_STATUS_COLOR[app.status ?? ""] ?? "bg-gray-100 text-gray-700"}>
                      {RESERVATION_STATUS_LABEL[app.status ?? ""] ?? app.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600">
                    {formatDateTimeWithMilliseconds(app.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      {canConfirm(app.status) && (
                        <button
                          type="button"
                          onClick={() => handleConfirm(app)}
                          className="cursor-pointer rounded-md p-1.5 text-green-600 transition-colors hover:bg-green-50"
                          title={app.status === "CONFIRMED" ? "확정 수량 수정" : "확정"}
                        >
                          <Check size={16} />
                        </button>
                      )}
                      {canReject(app.status) && (
                        <button
                          type="button"
                          onClick={() => handleReject(app)}
                          className="cursor-pointer rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50"
                          title="거절"
                        >
                          <X size={16} />
                        </button>
                      )}
                      {canCancel(app.status) && (
                        <button
                          type="button"
                          onClick={() => handleCancel(app)}
                          className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
                          title="취소"
                        >
                          <Ban size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        totalItems={totalElements}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        searchParams={paginationSearchParams}
        basePath={`/admin/reservations/${noticeId}`}
      />
    </div>
  );
}
