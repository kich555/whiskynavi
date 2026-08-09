import {
  GetApiV2AdminBottlesSortBy,
  GetApiV2AdminBottlesSortDirection,
  getApiV2AdminBottles,
  getApiV2AdminBottlesParameters,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseApiPage } from "@/lib/page-response";
import ProductsContent from "./_components/ProductsContent";

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    q?: string;
    brand?: string;
    distillery?: string;
    series?: string;
    caskType?: string;
    visible?: string;
    sortBy?: string;
    sortDirection?: string;
  }>;
}

function enumValue<T extends string>(value: string | undefined, values: Record<string, T>): T | undefined {
  return value && Object.values(values).includes(value as T) ? (value as T) : undefined;
}

function booleanValue(value: string | undefined) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const token = await getAuthToken();

  const [bottlesRes, bottleParamsRes] = await Promise.all([
    getApiV2AdminBottles(
      {
        page: parseApiPage(params.page),
        size: params.limit ? Number(params.limit) : 20,
        keyword: params.q || undefined,
        brand: params.brand ? [params.brand] : undefined,
        distillery: params.distillery ? [params.distillery] : undefined,
        series: params.series ? [params.series] : undefined,
        caskType: params.caskType ? [params.caskType] : undefined,
        visible: booleanValue(params.visible),
        sortBy: enumValue(params.sortBy, GetApiV2AdminBottlesSortBy),
        sortDirection: enumValue(params.sortDirection, GetApiV2AdminBottlesSortDirection),
      },
      withToken(token),
    ),
    getApiV2AdminBottlesParameters(withToken(token)),
  ]);

  return (
    <ProductsContent
      searchParams={params}
      products={bottlesRes.data.content ?? []}
      totalElements={bottlesRes.data.page?.totalElements ?? 0}
      brands={bottleParamsRes.data.brands ?? []}
      distilleries={bottleParamsRes.data.distilleries ?? []}
      series={bottleParamsRes.data.series ?? []}
      caskTypes={bottleParamsRes.data.caskTypes ?? []}
    />
  );
}
