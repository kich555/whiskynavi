import type { CartItemResponse, CartQuoteResponse } from "@/apis/generated/api";

export function normalizeCartQuantity(value: number, maxQuantity?: number): number {
  const parsed = Number.isFinite(value) ? Math.trunc(value) : 1;
  const upperLimit = maxQuantity && maxQuantity > 0 ? Math.max(Math.trunc(maxQuantity), 1) : Number.MAX_SAFE_INTEGER;
  return Math.min(Math.max(parsed, 1), upperLimit);
}

export function getValidCartItems(quote?: Pick<CartQuoteResponse, "items"> | null): CartItemResponse[] {
  return (quote?.items ?? []).filter((item) => item.valid !== false);
}

export function canCheckoutCart(quote?: Pick<CartQuoteResponse, "items"> | null): boolean {
  return getValidCartItems(quote).length > 0;
}

export function getCartBlockingReason(quote?: Pick<CartQuoteResponse, "items"> | null): string | undefined {
  const items = quote?.items ?? [];
  if (items.length === 0) return "장바구니에 담긴 상품이 없습니다.";
  if (!canCheckoutCart(quote)) return "주문 가능한 상품이 없습니다.";
  return undefined;
}

export { formatCurrency as formatCartCurrency } from "@/lib/formatters";
