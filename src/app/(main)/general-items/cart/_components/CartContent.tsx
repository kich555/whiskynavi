"use client";

import type { CartItemResponse, CartQuoteResponse } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { canCheckoutCart, formatCartCurrency, getCartBlockingReason, normalizeCartQuantity } from "../_lib/cart-utils";
import { removeCartItem, updateCartItemQuantity } from "../actions";

interface CartContentProps {
  error?: string;
  quote?: CartQuoteResponse | null;
}

const CART_ORDER_PATH = "/general-items/cart/order";

function getCartItemKey(item: CartItemResponse, index: number) {
  return item.cartItemId ?? item.saleAnnouncementId ?? index;
}

function getCartItemName(item: CartItemResponse) {
  return item.itemName || `상품 #${item.saleAnnouncementId ?? item.cartItemId ?? "-"}`;
}

function getCartItemDescription(item: CartItemResponse) {
  if (item.saleAnnouncementId != null) return `판매 공고 ${item.saleAnnouncementId}`;
  if (item.cartItemId != null) return `장바구니 상품 ${item.cartItemId}`;
  return "일반 상품";
}

function getCartItemMaxQuantity(item: CartItemResponse) {
  const limits = [item.availableQuantity, item.maxOrderQuantity].filter(
    (value): value is number => value != null && value > 0,
  );

  if (limits.length === 0) return undefined;
  return Math.min(...limits);
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={strong ? "text-base font-semibold text-white" : "typo-medium-14 text-gray-400"}>{label}</dt>
      <dd className={strong ? "text-lg font-semibold text-white" : "typo-medium-14 text-white"}>{value}</dd>
    </div>
  );
}

export default function CartContent({ error, quote }: CartContentProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const items = quote?.items ?? [];
  const blockingReason = getCartBlockingReason(quote);
  const canCheckout = canCheckoutCart(quote);

  const handleQuantityChange = (item: CartItemResponse, nextQuantity: number) => {
    if (!item.cartItemId) return;

    const quantity = normalizeCartQuantity(nextQuantity, getCartItemMaxQuantity(item));
    startTransition(async () => {
      try {
        const result = await updateCartItemQuantity(item.cartItemId!, quantity);
        if (!result.success) toast.error(result.error || "장바구니 수량을 변경하지 못했습니다.");
      } catch {
        toast.error("장바구니 수량을 변경하지 못했습니다.");
      }
    });
  };

  const handleRemove = (item: CartItemResponse) => {
    if (!item.cartItemId) return;

    startTransition(async () => {
      try {
        const result = await removeCartItem(item.cartItemId!);
        if (!result.success) toast.error(result.error || "장바구니 상품을 삭제하지 못했습니다.");
      } catch {
        toast.error("장바구니 상품을 삭제하지 못했습니다.");
      }
    });
  };

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 lg:px-10 lg:py-12">
      <div className="mb-8">
        <Button
          onClick={() => router.back()}
          className="typo-medium-14 mb-6 inline-flex cursor-pointer items-center gap-2 bg-transparent text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft size={18} />
          뒤로가기
        </Button>
        <p className="typo-medium-14 text-amber-300">일반상품 장바구니</p>
        <h1 className="typo-bold-24 mt-2 text-white md:text-3xl">주문할 상품을 확인해 주세요.</h1>
      </div>

      {error && (
        <div role="alert" className="typo-medium-14 mb-6 border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-100">
          {error}
        </div>
      )}

      {!quote && error ? null : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section className="border border-white/10 bg-white/5">
            <h2 className="sr-only">장바구니 상품</h2>
            {items.length === 0 ? (
              <div className="typo-medium-14 px-5 py-14 text-center text-gray-400">
                장바구니에 담긴 상품이 없습니다.
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {items.map((item, index) => {
                  const quantity = normalizeCartQuantity(item.quantity ?? 1, getCartItemMaxQuantity(item));
                  const isInvalid = item.valid === false;
                  const itemName = getCartItemName(item);
                  const disabledByItemState = !item.cartItemId || isInvalid || item.availableQuantity === 0;

                  return (
                    <li
                      key={getCartItemKey(item, index)}
                      className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold break-words text-white">{itemName}</h3>
                          {isInvalid && (
                            <span className="typo-medium-12 border border-red-400/30 px-2 py-0.5 text-red-200">
                              주문 불가
                            </span>
                          )}
                        </div>
                        <p className="typo-medium-14 mt-1 text-gray-400">{getCartItemDescription(item)}</p>
                        {item.invalidReason && <p className="typo-medium-14 mt-3 text-red-200">{item.invalidReason}</p>}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 md:justify-end">
                        <div className="flex items-center border border-white/15">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`${itemName} 수량 감소`}
                            disabled={isPending || disabledByItemState || quantity <= 1}
                            onClick={() => handleQuantityChange(item, quantity - 1)}
                            className="text-white hover:bg-white/10"
                          >
                            <Minus aria-hidden="true" />
                          </Button>
                          <span className="typo-medium-14 w-12 text-center text-white">{quantity}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`${itemName} 수량 증가`}
                            disabled={
                              isPending ||
                              disabledByItemState ||
                              quantity >= normalizeCartQuantity(Number.MAX_SAFE_INTEGER, getCartItemMaxQuantity(item))
                            }
                            onClick={() => handleQuantityChange(item, quantity + 1)}
                            className="text-white hover:bg-white/10"
                          >
                            <Plus aria-hidden="true" />
                          </Button>
                        </div>

                        <p className="typo-semibold-14 min-w-24 text-right text-white">
                          {formatCartCurrency(item.lineTotalPrice)}
                        </p>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`${itemName} 삭제`}
                          disabled={isPending || !item.cartItemId}
                          onClick={() => handleRemove(item)}
                          className="text-gray-300 hover:bg-white/10 hover:text-red-200"
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <aside className="border border-white/10 bg-white/5 p-5">
            <h2 className="typo-bold-18 mb-5 text-white">주문 요약</h2>
            <dl className="space-y-3">
              <SummaryRow label="상품 금액" value={formatCartCurrency(quote?.itemsTotalPrice)} />
              <SummaryRow label="배송비" value={formatCartCurrency(quote?.shippingFee)} />
              <div className="border-t border-white/10 pt-3">
                <SummaryRow label="총 결제 금액" value={formatCartCurrency(quote?.totalPrice)} strong />
              </div>
            </dl>

            {quote?.freeShipping !== true && quote?.freeShippingRemainingAmount != null && (
              <p className="typo-medium-14 mt-4 border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-amber-100">
                {formatCartCurrency(quote.freeShippingRemainingAmount)} 추가 주문 시 무료배송
              </p>
            )}

            <div className="mt-6">
              {canCheckout ? (
                <Button asChild className="w-full bg-amber-600 hover:bg-amber-700">
                  <Link href={CART_ORDER_PATH}>주문서로 이동</Link>
                </Button>
              ) : items.length > 0 ? (
                <p className="typo-semibold-14 border border-white/10 px-4 py-3 text-center text-gray-400">
                  {blockingReason}
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
