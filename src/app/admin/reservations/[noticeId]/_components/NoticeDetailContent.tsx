"use client";

import type {
  AdminBottleReservationApplicationResponse,
  AdminBottleReservationNoticeResponse,
  AdminReservationBusinessDeliveryResponse,
  DeliveryCompanyResponse,
  GetApiAdminBottlesReservationsApplicationsRole,
  GetApiAdminBottlesReservationsApplicationsStatus,
} from "@/apis/generated/api";
import { ArrowLeft, Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../../_components/AdminHeader";
import { useSidebar } from "../../../_components/AdminLayoutClient";
import ReservationExcelDownloadLink from "../../_components/ReservationExcelDownloadLink";
import { isReservationNoticeEditable } from "../../_lib/noticeStatus";
import ApplicationsTableSection from "./ApplicationsTableSection";
import ApprovalSummarySection from "./ApprovalSummarySection";
import NoticeInfoSection from "./NoticeInfoSection";
import ReservationDeliverySection from "./ReservationDeliverySection";

interface NoticeDetailContentProps {
  notice?: AdminBottleReservationNoticeResponse;
  applications: AdminBottleReservationApplicationResponse[];
  applicationsTotalElements: number;
  applicationsPage: number;
  applicationsLimit: number;
  applicationsRole?: GetApiAdminBottlesReservationsApplicationsRole;
  applicationsStatus?: GetApiAdminBottlesReservationsApplicationsStatus;
  deliveries: AdminReservationBusinessDeliveryResponse[];
  deliveryCompanies: DeliveryCompanyResponse[];
}

export default function NoticeDetailContent({
  notice,
  applications,
  applicationsTotalElements,
  applicationsPage,
  applicationsLimit,
  applicationsRole,
  applicationsStatus,
  deliveries,
  deliveryCompanies,
}: NoticeDetailContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();

  if (!notice) return null;
  if (notice.id == null) return null;

  const canEditNotice = isReservationNoticeEditable(notice);

  return (
    <>
      <AdminHeader title="예약 공고 상세" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            공고 목록으로 돌아가기
          </button>

          <div className="flex items-center gap-2">
            <ReservationExcelDownloadLink noticeId={notice.id} />
            {canEditNotice && (
              <button
                type="button"
                onClick={() => router.push(`/admin/reservations/${notice.id}/edit`)}
                className="typo-medium-14 flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700"
              >
                <Edit2 size={16} />
                편집
              </button>
            )}
          </div>
        </div>

        <NoticeInfoSection notice={notice} />

        <ApprovalSummarySection notice={notice} />

        <ReservationDeliverySection noticeId={notice.id} deliveries={deliveries} companies={deliveryCompanies} />

        <ApplicationsTableSection
          noticeId={notice.id}
          applications={applications}
          totalElements={applicationsTotalElements}
          currentPage={applicationsPage}
          itemsPerPage={applicationsLimit}
          pendingApplicationCount={notice.pendingApplicationCount ?? 0}
          currentRole={applicationsRole}
          currentStatus={applicationsStatus}
        />
      </div>
    </>
  );
}
