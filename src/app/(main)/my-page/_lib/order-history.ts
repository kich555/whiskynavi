import { GetApiV2OrdersOrderStatus, GetApiV2OrdersSort, type GetApiV2OrdersParams } from "@/apis/generated/api";
import { parseDisplayPage } from "@/lib/page-response";

export const ORDER_HISTORY_STATUS_OPTIONS = [
  { value: GetApiV2OrdersOrderStatus.ORDER_REQUESTED, label: "주문 접수" },
  { value: GetApiV2OrdersOrderStatus.PAYMENT_PENDING, label: "결제 대기" },
  { value: GetApiV2OrdersOrderStatus.ORDER_PREPARING, label: "주문 준비 중" },
  { value: GetApiV2OrdersOrderStatus.PAYMENT_COMPLETED, label: "결제 완료" },
  { value: GetApiV2OrdersOrderStatus.SHIPPING, label: "배송 중" },
  { value: GetApiV2OrdersOrderStatus.DELIVERY_COMPLETED, label: "배송 완료" },
  { value: GetApiV2OrdersOrderStatus.RECEIPT_PENDING, label: "수령 대기" },
  { value: GetApiV2OrdersOrderStatus.RECEIPT_COMPLETED, label: "수령 완료" },
  { value: GetApiV2OrdersOrderStatus.ORDER_CANCELED, label: "주문 취소" },
  { value: GetApiV2OrdersOrderStatus.CANCEL_REQUESTED, label: "취소 요청" },
] as const;

export const ORDER_HISTORY_SORT_OPTIONS = [
  { value: GetApiV2OrdersSort.CREATED_AT, label: "주문 생성일 최신순" },
  { value: GetApiV2OrdersSort.BOTTLED_DATE, label: "병입일 최신순" },
] as const;

const ORDER_HISTORY_STATUS_VALUES = new Set<GetApiV2OrdersOrderStatus>(
  ORDER_HISTORY_STATUS_OPTIONS.map((option) => option.value),
);
const ORDER_HISTORY_SORT_VALUES = new Set<GetApiV2OrdersSort>(ORDER_HISTORY_SORT_OPTIONS.map((option) => option.value));

export interface OrderHistoryFilters {
  orderStatus?: GetApiV2OrdersOrderStatus;
  manualOnly: boolean;
  sort: GetApiV2OrdersSort;
  page: number;
}

export type MyPageSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isOrderStatus(value: string | undefined): value is GetApiV2OrdersOrderStatus {
  return value !== undefined && ORDER_HISTORY_STATUS_VALUES.has(value as GetApiV2OrdersOrderStatus);
}

function isOrderSort(value: string | undefined): value is GetApiV2OrdersSort {
  return value !== undefined && ORDER_HISTORY_SORT_VALUES.has(value as GetApiV2OrdersSort);
}

export function parseOrderHistoryFilters(params: MyPageSearchParams): OrderHistoryFilters {
  const requestedStatus = firstValue(params.orderStatus);
  const requestedSort = firstValue(params.sort);
  const orderStatus = isOrderStatus(requestedStatus) ? requestedStatus : undefined;

  return {
    orderStatus,
    manualOnly: orderStatus === undefined && firstValue(params.manualOnly) === "true",
    sort: isOrderSort(requestedSort) ? requestedSort : GetApiV2OrdersSort.CREATED_AT,
    page: parseDisplayPage(firstValue(params.page)),
  };
}

export function toOrderHistoryApiParams(filters: OrderHistoryFilters, size = 10): GetApiV2OrdersParams {
  return {
    orderStatus: filters.orderStatus,
    manualOnly: filters.manualOnly || undefined,
    sort: filters.sort,
    page: filters.page - 1,
    size,
  };
}
