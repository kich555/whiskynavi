import { getApiAdminBottlesParameters, getApiV2AdminBottleSeries } from "@/apis/generated/api";
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
  brand?: string;
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

  const [response, parametersRes] = await Promise.all([
    getApiV2AdminBottleSeries(
      {
        keyword: params.q?.trim() || undefined,
        visible: parseVisible(params.visible),
        brand: params.brand?.trim() || undefined,
        page: parseApiPage(params.page),
        size: itemsPerPage,
      },
      withToken(token),
    ),
    getApiAdminBottlesParameters(withToken(token)),
  ]);

  // 실제 백엔드는 products와 동일하게 page.totalElements 중첩 구조로 응답하지만
  // 생성 타입이 flat으로 선언되어 있어 둘 다 안전하게 읽는다.
  const nestedTotalElements = (response.data as { page?: { totalElements?: number } }).page?.totalElements;
  const totalElements = response.data.totalElements ?? nestedTotalElements ?? 0;

  return (
    <BottleSeriesContent
      searchParams={params}
      series={response.data.content ?? []}
      totalElements={totalElements}
      brands={parametersRes.data.brands ?? []}
    />
  );
}
