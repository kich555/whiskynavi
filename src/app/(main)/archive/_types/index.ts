import { GetApiV2BottlesSort } from "@/apis/generated/api";

/**
 * 필터 상태 인터페이스
 */
export interface FilterState {
  keyword: string;
  brands: string[];
  distilleries: string[];
  names: string[];
  series: string[];
  companies: string[];
  maltTypes: string[];
  caskTypes: string[];
  abv: [number, number];
  vintage: [number, number];
  sort: GetApiV2BottlesSort;
}

/**
 * 필터 기본값 상수
 */
export const FILTER_DEFAULTS = {
  ABV_MIN: 40,
  ABV_MAX: 80,
  VINTAGE_MIN: 1960,
  VINTAGE_MAX: 2025,
  DEBOUNCE_MS: 300,
  KEYWORD_DEBOUNCE_MS: 800,
  SORT: GetApiV2BottlesSort.BOTTLED_DATE,
} as const;

/**
 * 초기 필터 상태
 */
export const INITIAL_FILTER_STATE: FilterState = {
  keyword: "",
  brands: [],
  distilleries: [],
  names: [],
  series: [],
  companies: [],
  maltTypes: [],
  caskTypes: [],
  abv: [FILTER_DEFAULTS.ABV_MIN, FILTER_DEFAULTS.ABV_MAX],
  vintage: [FILTER_DEFAULTS.VINTAGE_MIN, FILTER_DEFAULTS.VINTAGE_MAX],
  sort: FILTER_DEFAULTS.SORT,
};
