import { getApiUsersBusinessesPickupReservationsStatistics } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import BusinessStatisticsContent from "./_components/BusinessStatisticsContent";

interface BusinessStatisticsPageProps {
  searchParams: Promise<{
    month?: string;
  }>;
}

export default async function BusinessStatisticsPage({ searchParams }: BusinessStatisticsPageProps) {
  const params = await searchParams;
  const token = await getAuthToken();
  const res = await getApiUsersBusinessesPickupReservationsStatistics(
    { month: params.month },
    withToken(token),
  );

  return <BusinessStatisticsContent statistics={res.data} />;
}
