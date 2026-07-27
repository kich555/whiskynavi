import {
  GetApiV2BottlesSort,
  type BottleSearchParameterValues,
  type GetApiV2BottlesParams,
} from "@/apis/generated/api";
import { toApiPage } from "@/lib/page-response";
import { FILTER_DEFAULTS, type FilterState } from "../_types";

type BottleSearchUrlParams = Partial<Record<keyof GetApiV2BottlesParams, string | number>>;

export type SearchParams = BottleSearchUrlParams & { page?: string };

function getStringParam(value: string | number | undefined): string | undefined {
  const text = value == null ? undefined : String(value).trim();
  return text || undefined;
}

function getNumberParam(value: string | number | undefined): number | undefined {
  if (value == null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function getCsvArrayParam(value: string | number | undefined): string[] | undefined {
  const text = getStringParam(value);
  if (!text) return undefined;

  const values = text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? values : undefined;
}

export const buildPageUrl = (params: SearchParams, page: number): string => {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page") continue;
    if (value !== undefined && value !== null && value !== "") {
      sp.set(key, String(value));
    }
  }
  sp.set("page", String(page));
  return `/archive?${sp.toString()}`;
};

function getSortParam(value: string | number | undefined): GetApiV2BottlesSort {
  const normalized = getStringParam(value);
  return Object.values(GetApiV2BottlesSort).includes(normalized as GetApiV2BottlesSort)
    ? (normalized as GetApiV2BottlesSort)
    : FILTER_DEFAULTS.SORT;
}

export function buildBottleSearchApiParams(params: SearchParams, displayPage: number): GetApiV2BottlesParams {
  return {
    name: getStringParam(params.name),
    keyword: getStringParam(params.keyword),
    company: getCsvArrayParam(params.company),
    brand: getCsvArrayParam(params.brand),
    series: getCsvArrayParam(params.series),
    maltType: getCsvArrayParam(params.maltType),
    distillery: getCsvArrayParam(params.distillery),
    caskType: getCsvArrayParam(params.caskType),
    bottledDateFrom: getStringParam(params.bottledDateFrom),
    bottledDateTo: getStringParam(params.bottledDateTo),
    distillationDateFrom: getStringParam(params.distillationDateFrom),
    distillationDateTo: getStringParam(params.distillationDateTo),
    vintageFrom: getNumberParam(params.vintageFrom),
    vintageTo: getNumberParam(params.vintageTo),
    abvFrom: getNumberParam(params.abvFrom),
    abvTo: getNumberParam(params.abvTo),
    page: toApiPage(displayPage),
    size: 12,
    sort: getSortParam(params.sort),
  };
}

/**
 * 값이 어느 카테고리에 속하는지 찾는 함수
 * brands를 우선적으로 체크 (중복 값이 있을 경우 brands에 추가)
 */
export function findCategory(
  value: string,
  params: BottleSearchParameterValues,
): keyof BottleSearchParameterValues | null {
  if (params.brands?.includes(value)) {
    return "brands";
  }

  for (const key of Object.keys(params) as (keyof BottleSearchParameterValues)[]) {
    if (params[key]?.includes(value)) {
      return key;
    }
  }

  return null;
}

/**
 * BottleSearchParameterValues에서 모든 고유 값들을 추출
 */
export function extractAllValues(params: BottleSearchParameterValues): string[] {
  return [...new Set(Object.values(params).flatMap((value) => value ?? []))];
}

/**
 * FilterState를 보틀 검색 URL 쿼리 형식으로 변환
 */
export function convertFiltersToQueries(filterState: FilterState): BottleSearchUrlParams {
  const queries: BottleSearchUrlParams = {};

  // 통합검색어
  if (filterState.keyword) {
    queries.keyword = filterState.keyword;
  }

  if (filterState.sort !== FILTER_DEFAULTS.SORT) {
    queries.sort = filterState.sort;
  }

  // 배열 필터를 쉼표로 구분된 문자열로 변환
  const arrayFilters: Array<{
    key: keyof FilterState;
    queryKey: keyof BottleSearchUrlParams;
  }> = [
    { key: "brands", queryKey: "brand" },
    { key: "distilleries", queryKey: "distillery" },
    { key: "names", queryKey: "name" },
    { key: "series", queryKey: "series" },
    { key: "companies", queryKey: "company" },
    { key: "maltTypes", queryKey: "maltType" },
    { key: "caskTypes", queryKey: "caskType" },
  ];

  for (const { key, queryKey } of arrayFilters) {
    const values = filterState[key] as string[];
    if (values.length > 0) {
      queries[queryKey] = values.join(",");
    }
  }

  // ABV 범위 (기본값과 다를 때만 추가)
  if (filterState.abv[0] !== FILTER_DEFAULTS.ABV_MIN) {
    queries.abvFrom = filterState.abv[0];
  }
  if (filterState.abv[1] !== FILTER_DEFAULTS.ABV_MAX) {
    queries.abvTo = filterState.abv[1];
  }

  // Vintage 범위 (기본값과 다를 때만 추가)
  if (filterState.vintage[0] !== FILTER_DEFAULTS.VINTAGE_MIN) {
    queries.vintageFrom = filterState.vintage[0];
  }
  if (filterState.vintage[1] !== FILTER_DEFAULTS.VINTAGE_MAX) {
    queries.vintageTo = filterState.vintage[1];
  }

  return queries;
}

/**
 * URL SearchParams에서 FilterState 파싱
 */
export function parseFiltersFromSearchParams(searchParams: URLSearchParams): FilterState {
  const parseStringArray = (key: string): string[] => searchParams.get(key)?.split(",").filter(Boolean) ?? [];

  const parseNumber = (key: string, defaultValue: number): number => {
    const value = searchParams.get(key);
    if (value === null) return defaultValue;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  };

  return {
    keyword: searchParams.get("keyword") ?? "",
    brands: parseStringArray("brand"),
    distilleries: parseStringArray("distillery"),
    names: parseStringArray("name"),
    series: parseStringArray("series"),
    companies: parseStringArray("company"),
    maltTypes: parseStringArray("maltType"),
    caskTypes: parseStringArray("caskType"),
    abv: [parseNumber("abvFrom", FILTER_DEFAULTS.ABV_MIN), parseNumber("abvTo", FILTER_DEFAULTS.ABV_MAX)],
    vintage: [
      parseNumber("vintageFrom", FILTER_DEFAULTS.VINTAGE_MIN),
      parseNumber("vintageTo", FILTER_DEFAULTS.VINTAGE_MAX),
    ],
    sort: getSortParam(searchParams.get("sort") ?? undefined),
  };
}

/**
 * 보틀 검색 쿼리를 URLSearchParams 문자열로 변환
 */
export function buildQueryString(queries: BottleSearchUrlParams): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(queries)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  // 필터 변경 시 첫 페이지로 이동
  params.set("page", "1");

  return params.toString();
}

/**
 * 현재 선택된 모든 필터 값들을 하나의 배열로 합침
 */
export const getAllSelectedValues = (filters: FilterState): string[] => {
  return [
    ...filters.brands,
    ...filters.distilleries,
    ...filters.names,
    ...filters.series,
    ...filters.companies,
    ...filters.maltTypes,
    ...filters.caskTypes,
  ];
};
