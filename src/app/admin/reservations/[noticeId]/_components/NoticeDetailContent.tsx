"use client";

import type {
  AdminBottleReservationApplicationResponse,
  AdminBottleReservationNoticeResponse,
  AdminReservationBusinessDeliveryResponse,
  DeliveryCompanyResponse,
  GetApiAdminBottlesReservationsApplicationsRole,
  GetApiAdminBottlesReservationsApplicationsStatus,
} from "@/apis/generated/api";
import { ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import AdminHeader from "../../../_components/AdminHeader";
import { useSidebar } from "../../../_components/AdminLayoutClient";
import ReservationExcelDownloadLink from "../../_components/ReservationExcelDownloadLink";
import { isReservationNoticeEditable } from "../../_lib/noticeStatus";
import { deleteNoticeAction } from "../../actions";
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
  const [isPending, startTransition] = useTransition();

  if (!notice) return null;
  if (notice.id == null) return null;

  const canEditNotice = isReservationNoticeEditable(notice);
  const deleteDisabled = (notice.approvedQuantity ?? 0) > 0;

  const handleDelete = () => {
    if (!window.confirm(`"${notice.bottleName ?? `ID ${notice.id}`}" 예약 공고를 삭제하시겠습니까?`)) return;

    startTransition(async () => {
      const result = await deleteNoticeAction(notice.id!);
      if (result.success) {
        toast.success("예약 공고를 삭제했습니다.");
        router.push("/admin/reservations");
        return;
      }

      toast.error(result.error ?? "예약 공고 삭제에 실패했습니다.");
    });
  };

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
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending || deleteDisabled}
              className="typo-medium-14 flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              title={deleteDisabled ? "확정 또는 결제된 신청이 있는 공고는 삭제할 수 없습니다." : "삭제"}
            >
              <Trash2 size={16} />
              삭제
            </button>
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
