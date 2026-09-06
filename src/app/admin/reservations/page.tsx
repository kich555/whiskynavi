import { getApiAdminBottlesReservationsNotices } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseApiPage } from "@/lib/page-response";
import ReservationsContent from "./_components/ReservationsContent";

interface ReservationsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    q?: string;
  }>;
}

export default async function ReservationsPage({ searchParams }: ReservationsPageProps) {
  const params = await searchParams;
  const token = await getAuthToken();

  const res = await getApiAdminBottlesReservationsNotices(
    {
      page: parseApiPage(params.page),
      size: params.limit ? Number(params.limit) : 20,
    },
    withToken(token),
  );

  return (
    <ReservationsContent
      searchParams={params}
      notices={res.data.content ?? []}
      totalElements={res.data.page?.totalElements ?? 0}
    />
  );
}
