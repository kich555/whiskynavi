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

const LEGACY_ORDER_TYPE_LABEL: Record<string, string> = {
  GENERAL: "일반배송",
  PICKUP: "픽업",
  RESERVATION: "예약",
};

const LEGACY_SALE_TYPE_LABEL: Record<string, string> = {
  GENERAL: "일반판매",
  PICKUP: "픽업공고",
  RESERVATION: "예약공고",
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
  orderType?: string | null;
  saleType?: string | null;
}) {
  const labels = [
    getProductTypeLabel(input.productType),
    getFulfillmentMethodLabel(input.fulfillmentMethod),
    getSaleTimingLabel(input.saleTiming),
  ].filter((label) => label !== "-");

  if (labels.length > 0) return labels.join(" · ");

  const legacyLabels = [
    input.orderType ? (LEGACY_ORDER_TYPE_LABEL[input.orderType] ?? input.orderType) : null,
    input.saleType ? (LEGACY_SALE_TYPE_LABEL[input.saleType] ?? input.saleType) : null,
  ].filter(Boolean);

  return legacyLabels.length > 0 ? legacyLabels.join(" · ") : "-";
}
