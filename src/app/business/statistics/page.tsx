import { getApiUsersBusinessesPickupReservationsNoticeStatistics } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseApiPage } from "@/lib/page-response";
import BusinessStatisticsContent from "./_components/BusinessStatisticsContent";

interface BusinessStatisticsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function BusinessStatisticsPage({ searchParams }: BusinessStatisticsPageProps) {
  const params = await searchParams;
  const token = await getAuthToken();
  const res = await getApiUsersBusinessesPickupReservationsNoticeStatistics(
    { page: parseApiPage(params.page), size: 5 },
    withToken(token),
  );

  return <BusinessStatisticsContent statistics={res.data} />;
}
