import {
  getApiAdminOrdersUsersUserid,
  getApiAdminUsersId,
  getApiV2AdminUsersUseridReservationStatistics,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseApiPage, parseDisplayPage, parsePageSize } from "@/lib/page-response";
import { notFound } from "next/navigation";
import UserDetailContent from "./_components/UserDetailContent";

export interface UserDetailSearchParams extends Record<string, string | undefined> {
  limit?: string;
  page?: string;
  tab?: string;
  year?: string;
  includeAdminManualOrders?: string;
}

interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
  searchParams: Promise<UserDetailSearchParams>;
}

export default async function UserDetailPage({ params, searchParams }: UserDetailPageProps) {
  const { userId } = await params;
  const sp = await searchParams;
  const token = await getAuthToken();
  const currentOrderPage = parseDisplayPage(sp.page);
  const orderItemsPerPage = parsePageSize(sp.limit);
  const requestedYear = Number(sp.year);
  const reservationStatisticsYear =
    Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100
      ? requestedYear
      : new Date().getFullYear();
  const includeAdminManualOrders = sp.includeAdminManualOrders === "true";
  let user;
  let orderSummary;
  let reservationStatistics;

  try {
    const [userRes, orderRes, statisticsRes] = await Promise.all([
      getApiAdminUsersId(Number(userId), withToken(token)),
      getApiAdminOrdersUsersUserid(
        Number(userId),
        {
          page: parseApiPage(sp.page),
          size: orderItemsPerPage,
        },
        withToken(token),
      ),
      getApiV2AdminUsersUseridReservationStatistics(
        Number(userId),
        { year: reservationStatisticsYear, includeAdminManualOrders },
        withToken(token),
      ),
    ]);
    user = userRes.data;
    orderSummary = orderRes.data;
    reservationStatistics = statisticsRes.data;
  } catch {
    notFound();
  }

  return (
    <UserDetailContent
      user={user}
      orderSummary={orderSummary}
      searchParams={sp}
      initialActiveTab={sp.tab === "reservations" ? "reservations" : "info"}
      currentOrderPage={currentOrderPage}
      orderItemsPerPage={orderItemsPerPage}
      reservationStatistics={reservationStatistics}
      reservationStatisticsYear={reservationStatisticsYear}
      includeAdminManualOrders={includeAdminManualOrders}
    />
  );
}
