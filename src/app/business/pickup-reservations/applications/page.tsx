import {
  type GetApiUsersBusinessesPickupReservationsApplicationsStatus,
  getApiUsersBusinessesPickupReservationsApplications,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseApiPage, parsePositiveInt } from "@/lib/page-response";
import { notFound } from "next/navigation";
import PickupReservationApplicationsContent from "../_components/PickupReservationApplicationsContent";

interface PickupReservationApplicationsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    q?: string;
    searchType?: string;
    businessId?: string;
  }>;
}

export default async function PickupReservationApplicationsPage({
  searchParams,
}: PickupReservationApplicationsPageProps) {
  const params = await searchParams;
  const token = await getAuthToken();
  const pageSize = params.limit ? Number(params.limit) : 20;
  const keyword = params.q?.trim();
  const searchType = params.searchType ?? "userName";
  const businessId = params.businessId ? parsePositiveInt(params.businessId) : undefined;
  if (params.businessId && !businessId) notFound();
  const apiSearchParams = keyword
    ? {
        ...(searchType === "nickname" ? { nickname: keyword } : {}),
        ...(searchType === "phone" ? { phone: keyword } : {}),
        ...(searchType !== "nickname" && searchType !== "phone" ? { userName: keyword } : {}),
      }
    : {};

  const res = await getApiUsersBusinessesPickupReservationsApplications(
    {
      page: parseApiPage(params.page),
      size: pageSize,
      businessId,
      ...apiSearchParams,
      ...(params.status
        ? {
            status: params.status as GetApiUsersBusinessesPickupReservationsApplicationsStatus,
          }
        : {}),
    },
    withToken(token),
  );

  return (
    <PickupReservationApplicationsContent
      searchParams={params}
      applications={res.data.content ?? []}
      totalElements={res.data.page?.totalElements ?? 0}
    />
  );
}
