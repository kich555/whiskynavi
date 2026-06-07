import type { UserSaleAnnouncementResponse } from "@/apis/generated/api";

export function buildGeneralItemSaleDetailHref(sale: Pick<UserSaleAnnouncementResponse, "id">) {
  return sale.id != null ? `/general-items/${sale.id}` : "/general-items";
}

export function getGeneralItemOrderQuantityLimit(
  sale: Pick<UserSaleAnnouncementResponse, "availableQuantity" | "maxOrderQuantity">,
) {
  const availableQuantity = sale.availableQuantity != null && sale.availableQuantity > 0 ? sale.availableQuantity : 0;
  const maxOrderQuantity =
    sale.maxOrderQuantity != null && sale.maxOrderQuantity > 0 ? sale.maxOrderQuantity : undefined;

  return maxOrderQuantity == null ? availableQuantity : Math.min(availableQuantity, maxOrderQuantity);
}

export function normalizeGeneralItemOrderQuantity(value: number, limit: number) {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 1;
  const safeValue = Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;

  return Math.min(Math.max(safeValue, 1), safeLimit);
}

export function isOpenGeneralItemSale(sale: UserSaleAnnouncementResponse) {
  return sale.productType === "ITEM" && sale.saleType === "GENERAL" && sale.saleStatus === "OPEN";
}
