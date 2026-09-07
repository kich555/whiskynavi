import { describe, expect, it } from "vitest";
import { normalizeUserPurchaseStatisticsSearchParams, resolveBooleanFilter } from "./filters";

describe("user purchase statistics filters", () => {
  it("허용된 검색·필터·정렬 값을 유지한다", () => {
    expect(
      normalizeUserPurchaseStatisticsSearchParams({
        page: "2",
        limit: "50",
        q: "홍길동",
        searchField: "USERNAME",
        naviMember: "true",
        talesMember: "false",
        hasNaviPurchase: "true",
        hasTalesPurchase: "false",
        sortBy: "TALES_BOTTLE_KIND_COUNT",
        sortDirection: "ASC",
      }),
    ).toEqual({
      page: "2",
      limit: "50",
      q: "홍길동",
      searchField: "USERNAME",
      naviMember: "true",
      talesMember: "false",
      hasNaviPurchase: "true",
      hasTalesPurchase: "false",
      sortBy: "TALES_BOTTLE_KIND_COUNT",
      sortDirection: "ASC",
    });
  });

  it("알 수 없는 값은 안전한 기본값으로 바꾼다", () => {
    const result = normalizeUserPurchaseStatisticsSearchParams({
      searchField: "EMAIL",
      naviMember: "maybe",
      sortBy: "CREATED_AT",
      sortDirection: "SIDEWAYS",
    });

    expect(result.searchField).toBe("NAME");
    expect(result.naviMember).toBeUndefined();
    expect(result.sortBy).toBe("ID");
    expect(result.sortDirection).toBe("DESC");
  });

  it("URL의 세 상태 필터를 API boolean으로 변환한다", () => {
    expect(resolveBooleanFilter("true")).toBe(true);
    expect(resolveBooleanFilter("false")).toBe(false);
    expect(resolveBooleanFilter("all")).toBeUndefined();
    expect(resolveBooleanFilter()).toBeUndefined();
  });
});
