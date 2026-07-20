import { ApiError } from "@/apis/errors";
import { getApiUsersBusinessesPickupReservationsApplicationsApplicationid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parsePositiveInt } from "@/lib/page-response";
import { notFound } from "next/navigation";
import PickupApplicationDetailContent from "./_components/PickupApplicationDetailContent";

interface PickupApplicationDetailPageProps {
  params: Promise<{ applicationId: string }>;
  searchParams: Promise<{ businessId?: string }>;
}

export default async function PickupApplicationDetailPage({ params, searchParams }: PickupApplicationDetailPageProps) {
  const { applicationId } = await params;
  const { businessId: businessIdParam } = await searchParams;
  const token = await getAuthToken();
  const businessId = businessIdParam ? parsePositiveInt(businessIdParam) : undefined;
  if (businessIdParam && !businessId) notFound();
  let application;

  try {
    const res = await getApiUsersBusinessesPickupReservationsApplicationsApplicationid(
      Number(applicationId),
      { businessId },
      withToken(token),
    );
    application = res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return <PickupApplicationDetailContent application={application} businessId={businessId} />;
}
