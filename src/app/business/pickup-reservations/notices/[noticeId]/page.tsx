import {
  type GetApiUsersBusinessesPickupReservationsApplicationsStatus,
  getApiUsersBusinessesPickupReservationsApplications,
  getApiUsersBusinessesPickupReservationsNoticesNoticeidDetail,
  getApiUsersBusinessesReservationDeliveries,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseApiPage } from "@/lib/page-response";
import PickupNoticeApplicationsContent from "../../_components/PickupNoticeApplicationsContent";

interface PickupNoticeApplicationsPageProps {
  params: Promise<{
    noticeId: string;
  }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
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

export default async function PickupNoticeApplicationsPage({
  params,
  searchParams,
}: PickupNoticeApplicationsPageProps) {
  const routeParams = await params;
  const query = await searchParams;
  const token = await getAuthToken();
  const noticeId = Number(routeParams.noticeId);
  const pageSize = query.limit ? Number(query.limit) : 20;

  const [applicationsRes, deliveriesData, noticeData] = await Promise.all([
    getApiUsersBusinessesPickupReservationsApplications(
      {
        noticeId,
        page: parseApiPage(query.page),
        size: pageSize,
        ...(query.status
          ? {
              status: query.status as GetApiUsersBusinessesPickupReservationsApplicationsStatus,
            }
          : {}),
      },
      withToken(token),
    ),
    getOptionalData(getApiUsersBusinessesReservationDeliveries({ noticeId }, withToken(token))),
    getOptionalData(getApiUsersBusinessesPickupReservationsNoticesNoticeidDetail(noticeId, withToken(token))),
  ]);

  return (
    <PickupNoticeApplicationsContent
      noticeId={noticeId}
      searchParams={query}
      applications={applicationsRes.data.content ?? []}
      totalElements={applicationsRes.data.page?.totalElements ?? 0}
      deliveries={deliveriesData ?? []}
      notice={noticeData}
    />
  );
}
