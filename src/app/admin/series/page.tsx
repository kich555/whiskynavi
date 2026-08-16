import { getApiV2AdminBottleSeries } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseApiPage } from "@/lib/page-response";
import { SearchParams } from "@/types/search";
import SeriesList from "./_components/SeriesList";

interface SeriesPageProps {
  searchParams: Promise<
    SearchParams<{
      brand?: string;
      sort?: string;
      visible?: string;
    }>
  >;
}

export default async function SeriesPage({ searchParams }: SeriesPageProps) {
  const params = await searchParams;
  const token = await getAuthToken();

  const res = await getApiV2AdminBottleSeries(
    {
      page: parseApiPage(params.page),
      size: params.limit ? Number(params.limit) : 20,
      brand: params.brand ? params.brand : undefined,
      visible: params.visible ? params.visible === "true" : undefined,
    },
    withToken(token),
  );

  return (
    <SeriesList
      searchParams={params}
      series={res.data.content ?? []}
      totalElements={res.data.page?.totalElements ?? 0}
    />
  );
}
