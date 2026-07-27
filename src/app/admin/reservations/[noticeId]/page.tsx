import {
  type AdminBottleReservationApplicationResponse,
  type AdminBottleReservationNoticeResponse,
  type AdminReservationBusinessDeliveryResponse,
  type DeliveryCompanyResponse,
  GetApiAdminBottlesReservationsApplicationsApplicantType as AdminBottleReservationApplicantTypeOptions,
  GetApiAdminBottlesReservationsApplicationsRole as AdminBottleReservationApplicationRoleOptions,
  GetApiAdminBottlesReservationsApplicationsStatus as AdminBottleReservationApplicationStatusOptions,
  GetApiAdminBottlesReservationsApplicationsPickupAssignmentType as AdminBottleReservationPickupAssignmentTypeOptions,
  getApiAdminBottlesReservationsApplications,
  getApiAdminBottlesReservationsNoticesNoticeid,
  getApiAdminReservationDeliveriesCompanies,
  getApiAdminReservationDeliveriesNoticesNoticeid,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseApiPage, parsePositiveInt } from "@/lib/page-response";
import { notFound } from "next/navigation";
import NoticeDetailContent from "./_components/NoticeDetailContent";

interface NoticeDetailPageProps {
  params: Promise<{ noticeId: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    role?: string;
    status?: string;
    applicantType?: string;
    applicantBusinessId?: string;
    pickupBusinessId?: string;
    pickupAssignmentType?: string;
  }>;
}

async function getOptionalData<T>(request: Promise<{ data: T }>): Promise<T | undefined> {
  try {
    const response = await request;
    return response.data;
  } catch {
    return undefined;
  }
}

function getEnumValue<T extends Record<string, string>>(options: T, value?: string): T[keyof T] | undefined {
  if (!value) return undefined;
  const values = Object.values(options) as T[keyof T][];
  return values.includes(value as T[keyof T]) ? (value as T[keyof T]) : undefined;
}

export default async function NoticeDetailPage({ params, searchParams }: NoticeDetailPageProps) {
  const { noticeId } = await params;
  const sp = await searchParams;
  const token = await getAuthToken();
  const role = getEnumValue(AdminBottleReservationApplicationRoleOptions, sp.role);
  const status = getEnumValue(AdminBottleReservationApplicationStatusOptions, sp.status);
  const applicantType = getEnumValue(AdminBottleReservationApplicantTypeOptions, sp.applicantType);
  const pickupAssignmentType = getEnumValue(AdminBottleReservationPickupAssignmentTypeOptions, sp.pickupAssignmentType);
  const applicantBusinessId = parsePositiveInt(sp.applicantBusinessId);
  const pickupBusinessId = parsePositiveInt(sp.pickupBusinessId);

  let notice: AdminBottleReservationNoticeResponse | undefined;
  let applications: AdminBottleReservationApplicationResponse[] = [];
  let applicationsTotalElements = 0;
  let deliveries: AdminReservationBusinessDeliveryResponse[] = [];
  let deliveryCompanies: DeliveryCompanyResponse[] = [];

  try {
    const [noticeRes, applicationsRes, deliveriesData, companiesData] = await Promise.all([
      getApiAdminBottlesReservationsNoticesNoticeid(Number(noticeId), withToken(token)),
      getApiAdminBottlesReservationsApplications(
        {
          noticeId: Number(noticeId),
          role,
          status,
          applicantType,
          applicantBusinessId,
          pickupBusinessId,
          pickupAssignmentType,
          page: parseApiPage(sp.page),
          size: sp.limit ? Number(sp.limit) : 20,
          sort: ["createdAt,asc"],
        },
        withToken(token),
      ),
      getOptionalData(getApiAdminReservationDeliveriesNoticesNoticeid(Number(noticeId), withToken(token))),
      getOptionalData(getApiAdminReservationDeliveriesCompanies(withToken(token))),
    ]);

    notice = noticeRes.data;
    applications = applicationsRes.data.content ?? [];
    applicationsTotalElements = applicationsRes.data.page?.totalElements ?? 0;
    deliveries = deliveriesData ?? [];
    deliveryCompanies = companiesData ?? [];
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("[404]")) {
      notFound();
    }
    throw error;
  }

  return (
    <NoticeDetailContent
      notice={notice}
      applications={applications}
      applicationsTotalElements={applicationsTotalElements}
      applicationsPage={Number(sp.page) || 1}
      applicationsLimit={Number(sp.limit) || 20}
      applicationsRole={role}
      applicationsStatus={status}
      applicationsApplicantType={applicantType}
      applicationsApplicantBusinessId={applicantBusinessId}
      applicationsPickupBusinessId={pickupBusinessId}
      applicationsPickupAssignmentType={pickupAssignmentType}
      deliveries={deliveries}
      deliveryCompanies={deliveryCompanies}
    />
  );
}
