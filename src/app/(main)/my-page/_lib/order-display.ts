import type { UserOrderResponse } from "@/apis/generated/api";

export interface OrderDisplayNames {
  isBottleReservation: boolean;
  primaryName: string;
  secondaryName?: string;
}

export function getOrderDisplayNames(order: UserOrderResponse): OrderDisplayNames {
  const isBottleReservation = order.saleTiming === "RESERVATION" && order.productType === "BOTTLE";
  const itemName = order.itemName?.trim();
  const saleTitle = order.saleTitle?.trim();

  if (!isBottleReservation) {
    return {
      isBottleReservation,
      primaryName: itemName || saleTitle || "상품명 없음",
    };
  }

  const primaryName = saleTitle || itemName || "공고명 없음";
  return {
    isBottleReservation,
    primaryName,
    secondaryName: itemName && itemName !== primaryName ? itemName : undefined,
  };
}
