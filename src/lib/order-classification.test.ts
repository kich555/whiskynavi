import { describe, expect, it } from "vitest";
import { formatOrderClassification } from "./order-classification";

describe("formatOrderClassification", () => {
  it("새 주문 분류 축을 표시한다", () => {
    expect(
      formatOrderClassification({
        productType: "ITEM",
        fulfillmentMethod: "DIRECT_DELIVERY",
        saleTiming: "IMMEDIATE",
      }),
    ).toBe("아이템 · 직배송 · 바로배송");
  });

  it("레거시 주문 유형만 있으면 분류를 표시하지 않는다", () => {
    const legacyOrder = {
      orderType: "GENERAL",
      saleType: "GENERAL",
    };

    expect(formatOrderClassification(legacyOrder)).toBe("-");
  });
});
