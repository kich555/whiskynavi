import { getApiItemsId } from "@/apis/generated/api";
import type {
  GetApiSalesParams,
  PagedModelUserSaleAnnouncementResponse,
  UserSaleAnnouncementResponse,
} from "@/apis/generated/api";

type FetchSalesPage = (params: GetApiSalesParams) => Promise<{ data: PagedModelUserSaleAnnouncementResponse }>;

interface FetchOpenGeneralItemSalesPageOptions {
  fetchSales: FetchSalesPage;
  page: number;
  size: number;
  sourcePageSize?: number;
}

export function isOpenGeneralItemSale(sale: UserSaleAnnouncementResponse) {
  return sale.productType === "ITEM" && sale.saleType === "GENERAL" && sale.saleStatus === "OPEN";
}

export function collectGeneralItemProductIds(sales: Pick<UserSaleAnnouncementResponse, "productId">[]) {
  return Array.from(new Set(sales.map((sale) => sale.productId).filter((id): id is number => id != null)));
}

export async function fetchOpenGeneralItemSalesPage({
  fetchSales,
  page,
  size,
  sourcePageSize = 100,
}: FetchOpenGeneralItemSalesPageOptions) {
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
  const pageSize = Number.isFinite(size) && size > 0 ? size : 20;
  const sales: UserSaleAnnouncementResponse[] = [];
  let sourcePage = 0;
  let totalPages = 1;

  do {
    const response = await fetchSales({
      page: sourcePage,
      size: sourcePageSize,
      sort: ["createdAt,desc"],
      saleStatus: "OPEN",
    });
    const data = response.data;

    sales.push(...(data.content ?? []).filter(isOpenGeneralItemSale));
    totalPages = data.page?.totalPages ?? totalPages;

    sourcePage += 1;
  } while (sourcePage < totalPages);

  const start = (currentPage - 1) * pageSize;

  return {
    sales: sales.slice(start, start + pageSize),
    totalElements: sales.length,
  };
}

export async function fetchGeneralItemSaleImageMap(
  sales: UserSaleAnnouncementResponse[],
): Promise<Map<number, string>> {
  const productIds = collectGeneralItemProductIds(sales);
  const results = await Promise.allSettled(
    productIds.map(async (productId) => {
      const response = await getApiItemsId(productId);
      return [productId, response.data.imageUrl] as const;
    }),
  );

  return new Map(
    results
      .filter(
        (result): result is PromiseFulfilledResult<readonly [number, string | undefined]> =>
          result.status === "fulfilled",
      )
      .filter((result) => Boolean(result.value[1]))
      .map((result) => [result.value[0], result.value[1] as string]),
  );
}

export function buildGeneralItemSaleDetailHref(sale: Pick<UserSaleAnnouncementResponse, "id">) {
  return sale.id != null ? `/general-items/${sale.id}` : "/general-items";
}

export function getGeneralItemOrderQuantityLimit(
  sale: Pick<UserSaleAnnouncementResponse, "availableQuantity" | "maxOrderQuantity">,
) {
  const availableQuantity = sale.availableQuantity != null && sale.availableQuantity > 0 ? sale.availableQuantity : 0;
  const maxOrderQuantity =
    sale.maxOrderQuantity != null && sale.maxOrderQuantity > 0 ? sale.maxOrderQuantity : undefined;

  return maxOrderQuantity == null ? availableQuantity : Math.min(availableQuantity, maxOrderQuantity);
}

export function normalizeGeneralItemOrderQuantity(value: number, limit: number) {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 1;
  const safeValue = Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;

  return Math.min(Math.max(safeValue, 1), safeLimit);
}
