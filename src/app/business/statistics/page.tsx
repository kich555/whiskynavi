import { getApiUsersBusinessesPickupReservationsNoticeStatistics } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseApiPage } from "@/lib/page-response";
import BusinessStatisticsContent from "./_components/BusinessStatisticsContent";

interface BusinessStatisticsPageProps {
  searchParams: Promise<{
    businessId?: string;
    page?: string;
  }>;
}

function parseBusinessId(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export default async function BusinessStatisticsPage({ searchParams }: BusinessStatisticsPageProps) {
  const params = await searchParams;
  const token = await getAuthToken();
  const businessId = parseBusinessId(params.businessId);
  const res = await getApiUsersBusinessesPickupReservationsNoticeStatistics(
    { businessId, page: parseApiPage(params.page), size: 5 },
    withToken(token),
  );

  return <BusinessStatisticsContent statistics={res.data} selectedBusinessId={businessId} />;
}
