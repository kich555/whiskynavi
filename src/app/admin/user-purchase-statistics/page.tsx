import {
  getApiV2AdminUsersPurchaseStatistics,
  type GetApiV2AdminUsersPurchaseStatisticsParams,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseApiPage, parsePageSize } from "@/lib/page-response";
import UserPurchaseStatisticsContent from "./_components/UserPurchaseStatisticsContent";
import {
  normalizeUserPurchaseStatisticsSearchParams,
  resolveBooleanFilter,
  type UserPurchaseStatisticsRawSearchParams,
} from "./filters";

interface UserPurchaseStatisticsPageProps {
  searchParams: Promise<UserPurchaseStatisticsRawSearchParams>;
}

function getCurrentYearInSeoul(): number {
  return Number(
    new Intl.DateTimeFormat("en", {
      year: "numeric",
      timeZone: "Asia/Seoul",
    }).format(new Date()),
  );
}

export default async function UserPurchaseStatisticsPage({ searchParams }: UserPurchaseStatisticsPageProps) {
  const rawParams = await searchParams;
  const params = normalizeUserPurchaseStatisticsSearchParams(rawParams);
  const token = await getAuthToken();
  const filters: GetApiV2AdminUsersPurchaseStatisticsParams = {
    page: parseApiPage(params.page),
    size: Math.min(parsePageSize(params.limit), 100),
    keyword: params.q?.trim() || undefined,
    searchField: params.searchField,
    naviMember: resolveBooleanFilter(params.naviMember),
    talesMember: resolveBooleanFilter(params.talesMember),
    hasNaviPurchase: resolveBooleanFilter(params.hasNaviPurchase),
    hasTalesPurchase: resolveBooleanFilter(params.hasTalesPurchase),
    sortBy: params.sortBy,
    sortDirection: params.sortDirection,
  };

  const response = await getApiV2AdminUsersPurchaseStatistics(filters, withToken(token));
  const statistics = response.data.content ?? [];

  return (
    <UserPurchaseStatisticsContent
      searchParams={params}
      statistics={statistics}
      totalElements={response.data.page?.totalElements ?? 0}
      statisticsYear={statistics[0]?.statisticsYear ?? getCurrentYearInSeoul()}
      calculatedAt={statistics[0]?.calculatedAt ?? null}
    />
  );
}
