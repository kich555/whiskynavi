const PRODUCT_TYPE_LABEL: Record<string, string> = {
  BOTTLE: "보틀",
  ITEM: "아이템",
};

const FULFILLMENT_METHOD_LABEL: Record<string, string> = {
  DIRECT_DELIVERY: "직배송",
  PICKUP: "픽업",
};

const SALE_TIMING_LABEL: Record<string, string> = {
  IMMEDIATE: "바로배송",
  RESERVATION: "예약판매",
};

export function getProductTypeLabel(value?: string | null) {
  return value ? (PRODUCT_TYPE_LABEL[value] ?? value) : "-";
}

export function getFulfillmentMethodLabel(value?: string | null) {
  return value ? (FULFILLMENT_METHOD_LABEL[value] ?? value) : "-";
}

export function getSaleTimingLabel(value?: string | null) {
  return value ? (SALE_TIMING_LABEL[value] ?? value) : "-";
}

export function formatOrderClassification(input: {
  productType?: string | null;
  fulfillmentMethod?: string | null;
  saleTiming?: string | null;
}) {
  const labels = [
    getProductTypeLabel(input.productType),
    getFulfillmentMethodLabel(input.fulfillmentMethod),
    getSaleTimingLabel(input.saleTiming),
  ].filter((label) => label !== "-");

  return labels.length > 0 ? labels.join(" · ") : "-";
}
