import { describe, expect, it } from "vitest";
import { parseOrderHistoryFilters, toOrderHistoryApiParams } from "./order-history";

describe("order history filters", () => {
  it("지원하는 상태, 정렬, 페이지를 2.0 API 파라미터로 변환한다", () => {
    const filters = parseOrderHistoryFilters({
      orderStatus: "SHIPPING",
      sort: "BOTTLED_DATE",
      page: "3",
    });

    expect(toOrderHistoryApiParams(filters)).toEqual({
      orderStatus: "SHIPPING",
      manualOnly: undefined,
      sort: "BOTTLED_DATE",
      page: 2,
      size: 10,
    });
  });

  it("수동입력과 상태가 함께 전달되면 상태 필터만 활성화한다", () => {
    const filters = parseOrderHistoryFilters({
      orderStatus: "RECEIPT_PENDING",
      manualOnly: "true",
    });

    expect(filters.orderStatus).toBe("RECEIPT_PENDING");
    expect(filters.manualOnly).toBe(false);
    expect(toOrderHistoryApiParams(filters)).not.toMatchObject({ manualOnly: true });
  });

  it("지원하지 않는 값은 기본 조건으로 정규화한다", () => {
    expect(
      parseOrderHistoryFilters({
        orderStatus: "CANCEL_REJECTED",
        sort: "OLDEST",
        page: "0",
      }),
    ).toEqual({
      orderStatus: undefined,
      manualOnly: false,
      sort: "CREATED_AT",
      page: 1,
    });
  });
});
