import { getApiV2AdminBottleSeries } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import type { AdminSearchParams } from "@/app/admin/_lib/searchParams";
import { getAuthToken } from "@/lib/auth";
import { parseApiPage } from "@/lib/page-response";
import BottleSeriesContent from "./_components/BottleSeriesContent";

export interface BottleSeriesSearchParams extends AdminSearchParams {
  page?: string;
  limit?: string;
  q?: string;
  visible?: string;
}

interface BottleSeriesPageProps {
  searchParams: Promise<BottleSeriesSearchParams>;
}

function parsePageSize(value?: string): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 100 ? parsed : 20;
}

function parseVisible(value?: string): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export default async function BottleSeriesPage({ searchParams }: BottleSeriesPageProps) {
  const [params, token] = await Promise.all([searchParams, getAuthToken()]);
  const itemsPerPage = parsePageSize(params.limit);

  const response = await getApiV2AdminBottleSeries(
    {
      keyword: params.q?.trim() || undefined,
      visible: parseVisible(params.visible),
      page: parseApiPage(params.page),
      size: itemsPerPage,
    },
    withToken(token),
  );

  return (
    <BottleSeriesContent
      searchParams={params}
      series={response.data.content ?? []}
      totalElements={response.data.page?.totalElements ?? 0}
    />
  );
}
