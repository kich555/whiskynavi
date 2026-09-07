import type {
  GetApiV2AdminUsersPurchaseStatisticsSearchField,
  GetApiV2AdminUsersPurchaseStatisticsSortBy,
  GetApiV2AdminUsersPurchaseStatisticsSortDirection,
} from "@/apis/generated/api";

export const PURCHASE_STATISTICS_SEARCH_FIELD_OPTIONS = [
  { value: "NAME", label: "이름" },
  { value: "USERNAME", label: "사용자명" },
  { value: "ID", label: "ID" },
] as const;

export const PURCHASE_STATISTICS_BOOLEAN_FILTER_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "true", label: "회원" },
  { value: "false", label: "비회원" },
] as const;

export const PURCHASE_STATISTICS_SORT_FIELDS = {
  ID: "ID",
  NAME: "이름",
  USERNAME: "사용자명",
  NAVI_MEMBER: "내비 회원 여부",
  NAVI_BOTTLE_QUANTITY: "내비 구매 병수",
  NAVI_BOTTLE_KIND_COUNT: "내비 구매 종류 수",
  TALES_MEMBER: "테일즈 회원 여부",
  TALES_BOTTLE_QUANTITY: "테일즈 구매 병수",
  TALES_BOTTLE_KIND_COUNT: "테일즈 구매 종류 수",
} as const satisfies Record<GetApiV2AdminUsersPurchaseStatisticsSortBy, string>;

export type PurchaseStatisticsFilterValue = "all" | "true" | "false";

export type UserPurchaseStatisticsSearchParams = {
  page?: string;
  limit?: string;
  q?: string;
  searchField?: GetApiV2AdminUsersPurchaseStatisticsSearchField;
  naviMember?: PurchaseStatisticsFilterValue;
  talesMember?: PurchaseStatisticsFilterValue;
  minNaviBottleQuantity?: string;
  minTalesBottleQuantity?: string;
  sortBy?: GetApiV2AdminUsersPurchaseStatisticsSortBy;
  sortDirection?: GetApiV2AdminUsersPurchaseStatisticsSortDirection;
};

export type UserPurchaseStatisticsRawSearchParams = {
  [Key in keyof UserPurchaseStatisticsSearchParams]?: string | string[];
};

const SEARCH_FIELDS = new Set<GetApiV2AdminUsersPurchaseStatisticsSearchField>(["ID", "NAME", "USERNAME"]);
const SORT_FIELDS = new Set<GetApiV2AdminUsersPurchaseStatisticsSortBy>(
  Object.keys(PURCHASE_STATISTICS_SORT_FIELDS) as GetApiV2AdminUsersPurchaseStatisticsSortBy[],
);
const FILTER_VALUES = new Set<PurchaseStatisticsFilterValue>(["all", "true", "false"]);

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeFilter(value: string | undefined): PurchaseStatisticsFilterValue | undefined {
  return value && FILTER_VALUES.has(value as PurchaseStatisticsFilterValue)
    ? (value as PurchaseStatisticsFilterValue)
    : undefined;
}

function normalizeMinimumQuantity(value: string | undefined): string | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;

  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= 2_147_483_647 ? String(quantity) : undefined;
}

export function normalizeUserPurchaseStatisticsSearchParams(
  params: UserPurchaseStatisticsRawSearchParams,
): UserPurchaseStatisticsSearchParams {
  const searchField = firstQueryValue(params.searchField);
  const sortBy = firstQueryValue(params.sortBy);
  const sortDirection = firstQueryValue(params.sortDirection);

  return {
    page: firstQueryValue(params.page),
    limit: firstQueryValue(params.limit),
    q: firstQueryValue(params.q),
    searchField:
      searchField && SEARCH_FIELDS.has(searchField as GetApiV2AdminUsersPurchaseStatisticsSearchField)
        ? (searchField as GetApiV2AdminUsersPurchaseStatisticsSearchField)
        : "NAME",
    naviMember: normalizeFilter(firstQueryValue(params.naviMember)),
    talesMember: normalizeFilter(firstQueryValue(params.talesMember)),
    minNaviBottleQuantity: normalizeMinimumQuantity(firstQueryValue(params.minNaviBottleQuantity)),
    minTalesBottleQuantity: normalizeMinimumQuantity(firstQueryValue(params.minTalesBottleQuantity)),
    sortBy:
      sortBy && SORT_FIELDS.has(sortBy as GetApiV2AdminUsersPurchaseStatisticsSortBy)
        ? (sortBy as GetApiV2AdminUsersPurchaseStatisticsSortBy)
        : "ID",
    sortDirection: sortDirection === "ASC" ? "ASC" : "DESC",
  };
}

export function resolveBooleanFilter(value?: PurchaseStatisticsFilterValue): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function resolveMinimumQuantity(value?: string): number | undefined {
  const normalized = normalizeMinimumQuantity(value);
  return normalized ? Number(normalized) : undefined;
}
