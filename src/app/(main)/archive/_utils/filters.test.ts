import type { BottleSearchParameterValues } from "@/apis/generated/api";
import { GetApiV2BottlesDirection, GetApiV2BottlesSort } from "@/apis/generated/api";
import { describe, expect, it } from "vitest";
import { INITIAL_FILTER_STATE, type FilterState } from "../_types";
import {
  buildBottleSearchApiParams,
  buildPageUrl,
  buildQueryString,
  convertFiltersToQueries,
  extractAllValues,
  findCategory,
  getAllSelectedValues,
  parseFiltersFromSearchParams,
} from "./index";

const emptyFilter: FilterState = { ...INITIAL_FILTER_STATE };

describe("buildPageUrl", () => {
  it("정렬 기준과 방향은 유지하면서 page를 갱신한다", () => {
    const url = buildPageUrl(
      {
        keyword: "yummy",
        page: "1",
        sort: GetApiV2BottlesSort.REGISTERED,
        direction: GetApiV2BottlesDirection.ASC,
      },
      3,
    );
    expect(url).toBe("/archive?keyword=yummy&sort=REGISTERED&direction=ASC&page=3");
  });

  it("빈 값은 제외하고 직렬화한다", () => {
    const url = buildPageUrl({ keyword: "", brand: "macc", page: "1" }, 2);
    expect(url).toBe("/archive?brand=macc&page=2");
  });
});

describe("buildBottleSearchApiParams", () => {
  it("CSV 배열 파라미터를 분리하고 페이지를 API 인덱스로 변환한다", () => {
    const params = buildBottleSearchApiParams({ brand: "a,b,c", page: "1" }, 2);
    expect(params.brand).toEqual(["a", "b", "c"]);
    expect(params.page).toBe(1); // displayPage 2 → API page 1 (1-indexed → 0-indexed 보정)
    expect(params.size).toBe(12);
    expect(params.sort).toBe(GetApiV2BottlesSort.BOTTLED_DATE);
    expect(params.direction).toBe(GetApiV2BottlesDirection.DESC);
  });

  it("숫자 범위 파라미터를 숫자로 변환한다", () => {
    const params = buildBottleSearchApiParams(
      { vintageFrom: "1990", vintageTo: "2000", abvFrom: "45", abvTo: "55" },
      1,
    );
    expect(params.vintageFrom).toBe(1990);
    expect(params.vintageTo).toBe(2000);
    expect(params.abvFrom).toBe(45);
    expect(params.abvTo).toBe(55);
  });

  it("문자열 파라미터를 trim하여 전달한다", () => {
    const params = buildBottleSearchApiParams({ keyword: "  hello  " }, 1);
    expect(params.keyword).toBe("hello");
  });

  it("빈 값은 undefined로 처리한다", () => {
    const params = buildBottleSearchApiParams({ keyword: "", brand: "" }, 1);
    expect(params.keyword).toBeUndefined();
    expect(params.brand).toBeUndefined();
  });
});

describe("findCategory", () => {
  const params: BottleSearchParameterValues = {
    brands: ["macallan", "yamazaki"],
    distilleries: ["yoichi"],
  };

  it("값이 brands에 있으면 brands를 반환한다 (우선)", () => {
    expect(findCategory("macallan", params)).toBe("brands");
  });

  it("값이 다른 카테고리에 있으면 해당 키를 반환한다", () => {
    expect(findCategory("yoichi", params)).toBe("distilleries");
  });

  it("값이 어디에도 없으면 null을 반환한다", () => {
    expect(findCategory("nonexistent", params)).toBeNull();
  });
});

describe("extractAllValues", () => {
  it("모든 카테고리 값을 중복 제거하여 합친다", () => {
    const params: BottleSearchParameterValues = {
      brands: ["a", "b"],
      distilleries: ["b", "c"],
      names: undefined,
    };
    expect(extractAllValues(params).sort()).toEqual(["a", "b", "c"]);
  });

  it("빈 params는 빈 배열을 반환한다", () => {
    expect(extractAllValues({ brands: undefined, distilleries: undefined })).toEqual([]);
  });
});

describe("convertFiltersToQueries ↔ parseFiltersFromSearchParams", () => {
  it("배열 필터를 CSV 문자열로 직렬화한다", () => {
    const filter: FilterState = {
      ...emptyFilter,
      brands: ["macallan", "yamazaki"],
      companies: ["suntory"],
    };
    expect(convertFiltersToQueries(filter)).toEqual({
      brand: "macallan,yamazaki",
      company: "suntory",
    });
  });

  it("기본값과 같은 ABV/Vintage 범위는 쿼리에서 제외한다", () => {
    expect(convertFiltersToQueries(emptyFilter)).toEqual({});
  });

  it("기본값과 다른 범위만 쿼리에 포함한다", () => {
    const filter: FilterState = {
      ...emptyFilter,
      abv: [50, 80], // abvFrom만 기본값(40)과 다름
    };
    expect(convertFiltersToQueries(filter)).toEqual({ abvFrom: 50 });
  });

  it("keyword를 전달한다", () => {
    const filter: FilterState = { ...emptyFilter, keyword: "sherry" };
    expect(convertFiltersToQueries(filter)).toEqual({ keyword: "sherry" });
  });

  it("기본값이 아닌 정렬을 전달한다", () => {
    const filter: FilterState = {
      ...emptyFilter,
      sort: GetApiV2BottlesSort.MATURATION_AGE,
    };
    expect(convertFiltersToQueries(filter)).toEqual({ sort: "MATURATION_AGE" });
  });

  it("오름차순을 정렬 방향 쿼리로 전달한다", () => {
    const filter: FilterState = {
      ...emptyFilter,
      direction: GetApiV2BottlesDirection.ASC,
    };
    expect(convertFiltersToQueries(filter)).toEqual({ direction: "ASC" });
  });

  it("직렬화한 쿼리를 다시 파싱하면 원래 상태로 복원된다", () => {
    const original: FilterState = {
      ...emptyFilter,
      keyword: "cask",
      brands: ["a", "b"],
      abv: [45, 60],
      vintage: [1990, 2000],
      sort: GetApiV2BottlesSort.DISTILLATION_DATE,
      direction: GetApiV2BottlesDirection.ASC,
    };
    const queries = convertFiltersToQueries(original);
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(queries)) search.set(k, String(v));
    const restored = parseFiltersFromSearchParams(search);
    expect(restored).toEqual(original);
  });

  it("파싱 시 잘못된 숫자는 기본값으로 대체한다", () => {
    const search = new URLSearchParams("abvFrom=abc&abvTo=50");
    const restored = parseFiltersFromSearchParams(search);
    expect(restored.abv).toEqual([40, 50]); // abvFrom 기본값 40
  });
});

describe("buildQueryString", () => {
  it("빈 값은 제외하고 page=1을 붙인다", () => {
    const qs = buildQueryString({ keyword: "yummy", brand: "", company: undefined });
    expect(qs).toBe("keyword=yummy&page=1");
  });
});

describe("getAllSelectedValues", () => {
  it("모든 배열 필터를 하나로 합친다", () => {
    const filter: FilterState = {
      ...emptyFilter,
      brands: ["a"],
      distilleries: ["b"],
      names: ["c"],
      series: ["d"],
      companies: ["e"],
      maltTypes: ["f"],
      caskTypes: ["g"],
    };
    expect(getAllSelectedValues(filter)).toEqual(["a", "b", "c", "d", "e", "f", "g"]);
  });

  it("선택된 값이 없으면 빈 배열을 반환한다", () => {
    expect(getAllSelectedValues(emptyFilter)).toEqual([]);
  });
});
