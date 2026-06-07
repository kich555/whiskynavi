import { describe, expect, it } from "vitest";
import {
  buildGeneralItemSaleDetailHref,
  getGeneralItemOrderQuantityLimit,
  normalizeGeneralItemOrderQuantity,
} from "./general-item-sales";

describe("public general item sales", () => {
  it("builds a sale detail href from a sale announcement", () => {
    expect(buildGeneralItemSaleDetailHref({ id: 10 })).toBe("/general-items/10");
    expect(buildGeneralItemSaleDetailHref({ id: undefined })).toBe("/general-items");
  });

  it("uses the smaller stock or per-order quantity as the order quantity limit", () => {
    expect(getGeneralItemOrderQuantityLimit({ availableQuantity: 8, maxOrderQuantity: 3 })).toBe(3);
    expect(getGeneralItemOrderQuantityLimit({ availableQuantity: 2, maxOrderQuantity: 5 })).toBe(2);
    expect(getGeneralItemOrderQuantityLimit({ availableQuantity: 4, maxOrderQuantity: undefined })).toBe(4);
    expect(getGeneralItemOrderQuantityLimit({ availableQuantity: 0, maxOrderQuantity: 3 })).toBe(0);
  });

  it("normalizes selected order quantity inside the available range", () => {
    expect(normalizeGeneralItemOrderQuantity(3, 5)).toBe(3);
    expect(normalizeGeneralItemOrderQuantity(0, 5)).toBe(1);
    expect(normalizeGeneralItemOrderQuantity(9, 5)).toBe(5);
    expect(normalizeGeneralItemOrderQuantity(Number.NaN, 5)).toBe(1);
    expect(normalizeGeneralItemOrderQuantity(1, 0)).toBe(1);
  });

});
