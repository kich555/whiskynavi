import {
  getApiUsersBusinessesPickupReservationsNoticesStatuses,
  getApiUsersBusinessesReservationDeliveries,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseApiPage, parsePositiveInt } from "@/lib/page-response";
import { notFound } from "next/navigation";
import PickupReservationsContent from "./_components/PickupReservationsContent";

interface PickupReservationsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    businessId?: string;
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

export default async function PickupReservationsPage({ searchParams }: PickupReservationsPageProps) {
  const params = await searchParams;
  const token = await getAuthToken();
  const businessId = params.businessId ? parsePositiveInt(params.businessId) : undefined;
  if (params.businessId && !businessId) notFound();

  const [noticesRes, deliveriesData] = await Promise.all([
    getApiUsersBusinessesPickupReservationsNoticesStatuses(
      {
        page: parseApiPage(params.page),
        size: params.limit ? Number(params.limit) : 20,
        businessId,
      },
      withToken(token),
    ),
    getOptionalData(getApiUsersBusinessesReservationDeliveries({ businessId }, withToken(token))),
  ]);

  return (
    <PickupReservationsContent
      searchParams={params}
      notices={noticesRes.data.content ?? []}
      totalElements={noticesRes.data.page?.totalElements ?? 0}
      deliveries={deliveriesData ?? []}
    />
  );
}
