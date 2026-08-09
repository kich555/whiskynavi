import {
  getApiAdminBottlesId,
  getApiV2AdminBottlesBottleidManualPurchases,
  getApiV2AdminBottlesBottleidReservationNotices,
  getApiV2AdminBottlesBottleidReservations,
  type BottleAdminResponse,
  type GetApiV2AdminBottlesBottleidManualPurchasesParams,
  type GetApiV2AdminBottlesBottleidReservationNoticesParams,
  type GetApiV2AdminBottlesBottleidReservationsParams,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import type { AdminSearchParams, AdminSearchParamValue } from "@/app/admin/_lib/searchParams";
import { getAuthToken } from "@/lib/auth";
import { parseDisplayPage, parsePageSize, parsePositiveInt, toApiPage } from "@/lib/page-response";
import { notFound } from "next/navigation";
import ProductDetailContent from "./_components/ProductDetailContent";
import RelatedBottleManagementSections from "./_components/RelatedBottleManagementSections";

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
  searchParams: Promise<AdminSearchParams>;
}

function single(value: AdminSearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function optional(value: AdminSearchParamValue): string | undefined {
  return single(value)?.trim() || undefined;
}

function pageSize(value: AdminSearchParamValue): number {
  return Math.min(100, parsePageSize(single(value)));
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const [{ productId }, query] = await Promise.all([params, searchParams]);
  const token = await getAuthToken();
  const bottleId = Number(productId);
  const authOptions = withToken(token);

  const noticePage = parseDisplayPage(single(query.noticePage));
  const noticeLimit = pageSize(query.noticeLimit);
  const reservationPage = parseDisplayPage(single(query.reservationPage));
  const reservationLimit = pageSize(query.reservationLimit);
  const manualPage = parseDisplayPage(single(query.manualPage));
  const manualLimit = pageSize(query.manualLimit);

  const noticeParams: GetApiV2AdminBottlesBottleidReservationNoticesParams = {
    page: toApiPage(noticePage),
    size: noticeLimit,
    keyword: optional(query.noticeKeyword),
    status: optional(query.noticeStatus) as GetApiV2AdminBottlesBottleidReservationNoticesParams["status"],
    createdAtFrom: optional(query.noticeCreatedAtFrom),
    createdAtTo: optional(query.noticeCreatedAtTo),
    sortBy: (optional(query.noticeSortBy) ??
      "RESERVATION_START_AT") as GetApiV2AdminBottlesBottleidReservationNoticesParams["sortBy"],
    sortDirection: (optional(query.noticeSortDirection) ??
      "DESC") as GetApiV2AdminBottlesBottleidReservationNoticesParams["sortDirection"],
  };
  const reservationParams: GetApiV2AdminBottlesBottleidReservationsParams = {
    page: toApiPage(reservationPage),
    size: reservationLimit,
    keyword: optional(query.reservationKeyword),
    status: optional(query.reservationStatus) as GetApiV2AdminBottlesBottleidReservationsParams["status"],
    noticeId: parsePositiveInt(single(query.reservationNoticeId)),
    createdAtFrom: optional(query.reservationCreatedAtFrom),
    createdAtTo: optional(query.reservationCreatedAtTo),
    sortBy: (optional(query.reservationSortBy) ??
      "CREATED_AT") as GetApiV2AdminBottlesBottleidReservationsParams["sortBy"],
    sortDirection: (optional(query.reservationSortDirection) ??
      "DESC") as GetApiV2AdminBottlesBottleidReservationsParams["sortDirection"],
  };
  const manualParams: GetApiV2AdminBottlesBottleidManualPurchasesParams = {
    page: toApiPage(manualPage),
    size: manualLimit,
    keyword: optional(query.manualKeyword),
    status: optional(query.manualStatus) as GetApiV2AdminBottlesBottleidManualPurchasesParams["status"],
    createdAtFrom: optional(query.manualCreatedAtFrom),
    createdAtTo: optional(query.manualCreatedAtTo),
    sortBy: (optional(query.manualSortBy) ??
      "CREATED_AT") as GetApiV2AdminBottlesBottleidManualPurchasesParams["sortBy"],
    sortDirection: (optional(query.manualSortDirection) ??
      "DESC") as GetApiV2AdminBottlesBottleidManualPurchasesParams["sortDirection"],
  };

  const productRequest = getApiAdminBottlesId(bottleId, authOptions);
  const reservationNoticesRequest = getApiV2AdminBottlesBottleidReservationNotices(
    "2.0",
    bottleId,
    noticeParams,
    authOptions,
  );
  const reservationsRequest = getApiV2AdminBottlesBottleidReservations("2.0", bottleId, reservationParams, authOptions);
  const manualPurchasesRequest = getApiV2AdminBottlesBottleidManualPurchases(
    "2.0",
    bottleId,
    manualParams,
    authOptions,
  );

  let product: BottleAdminResponse | undefined;
  try {
    const res = await productRequest;
    product = res.data;
  } catch {
    notFound();
  }

  const [reservationNotices, reservations, manualPurchases] = await Promise.all([
    reservationNoticesRequest,
    reservationsRequest,
    manualPurchasesRequest,
  ]);

  return (
    <ProductDetailContent product={product}>
      <RelatedBottleManagementSections
        bottleId={bottleId}
        searchParams={query}
        reservationNotices={reservationNotices.data.content ?? []}
        reservationNoticeCount={reservationNotices.data.page?.totalElements ?? 0}
        reservationNoticePage={noticePage}
        reservationNoticeLimit={noticeLimit}
        reservations={reservations.data.content ?? []}
        reservationCount={reservations.data.page?.totalElements ?? 0}
        reservationPage={reservationPage}
        reservationLimit={reservationLimit}
        manualPurchases={manualPurchases.data.content ?? []}
        manualPurchaseCount={manualPurchases.data.page?.totalElements ?? 0}
        manualPurchasePage={manualPage}
        manualPurchaseLimit={manualLimit}
      />
    </ProductDetailContent>
  );
}
