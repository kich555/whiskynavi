import type { UserOrderResponse } from "@/apis/generated/api";
import { describe, expect, it } from "vitest";
import { getOrderDisplayNames } from "./order-display";

describe("getOrderDisplayNames", () => {
  it("보틀 예약 주문은 공고명을 주 제목으로 표시한다", () => {
    const order: UserOrderResponse = {
      saleTiming: "RESERVATION",
      productType: "BOTTLE",
      saleTitle: "7월 커뮤니티 공고",
      itemName: "테스트 보틀",
    };

    expect(getOrderDisplayNames(order)).toEqual({
      isBottleReservation: true,
      primaryName: "7월 커뮤니티 공고",
      secondaryName: "테스트 보틀",
    });
  });

  it("일반 상품 주문은 기존처럼 상품명을 우선한다", () => {
    const order: UserOrderResponse = {
      saleTiming: "IMMEDIATE",
      productType: "ITEM",
      saleTitle: "여름 판매",
      itemName: "테이스팅 글라스",
    };

    expect(getOrderDisplayNames(order)).toEqual({
      isBottleReservation: false,
      primaryName: "테이스팅 글라스",
    });
  });

  it("공고명이 없는 과거 보틀 예약은 보틀명으로 폴백한다", () => {
    const order: UserOrderResponse = {
      saleTiming: "RESERVATION",
      productType: "BOTTLE",
      itemName: "과거 보틀",
    };

    expect(getOrderDisplayNames(order).primaryName).toBe("과거 보틀");
  });
});
