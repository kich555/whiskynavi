"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { normalizeGeneralItemOrderQuantity } from "../../_lib/general-item-sales";
import { addToCartFormAction } from "../actions";

interface GeneralItemOrderFormProps {
  saleAnnouncementId: number;
  quantityLimit: number;
}

export default function GeneralItemOrderForm({ saleAnnouncementId, quantityLimit }: GeneralItemOrderFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [state, formAction, isPending] = useActionState(addToCartFormAction, { success: false });

  const updateQuantity = (next: number) => {
    setQuantity(normalizeGeneralItemOrderQuantity(next, quantityLimit));
  };

  return (
    <form className="grid gap-4" action={formAction}>
      <input type="hidden" name="saleAnnouncementId" value={saleAnnouncementId} />

      <div>
        <div className="flex w-full items-center justify-between gap-4">
          <label className="shrink-0 text-sm font-medium text-gray-200" htmlFor="quantity">
            수량
          </label>
          <div className="flex w-fit items-center border border-white/15 bg-black/20">
            <button
              type="button"
              onClick={() => updateQuantity(quantity - 1)}
              className="h-7 w-10 cursor-pointer text-base font-semibold text-white transition-colors hover:bg-white/10 disabled:text-gray-600"
              disabled={quantity <= 1}
              aria-label="수량 감소"
            >
              -
            </button>
            <input
              id="quantity"
              name="quantity"
              type="number"
              inputMode="numeric"
              min={1}
              max={quantityLimit}
              value={quantity}
              onChange={(event) => updateQuantity(Number(event.target.value))}
              required
              className="h-7 w-14 border-x border-white/15 bg-transparent px-2 text-center text-white outline-none focus:bg-white/5"
            />
            <button
              type="button"
              onClick={() => updateQuantity(quantity + 1)}
              className="h-7 w-10 cursor-pointer text-base font-semibold text-white transition-colors hover:bg-white/10 disabled:text-gray-600"
              disabled={quantity >= quantityLimit}
              aria-label="수량 증가"
            >
              +
            </button>
          </div>
        </div>
        <p className="mt-2 text-right text-xs text-gray-400">
          최대 {quantityLimit.toLocaleString("ko-KR")}개까지 선택할 수 있습니다.
        </p>
      </div>

      {state.success && !isPending && (
        <div
          className="grid gap-3 border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100"
          role="status"
        >
          <p>장바구니에 상품을 담았습니다.</p>
          <Link className="font-semibold text-emerald-50 underline underline-offset-4" href="/general-items/cart">
            장바구니 보기
          </Link>
        </div>
      )}

      {state.error && (
        <p className="border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100" role="alert">
          {state.error}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="submit"
          name="intent"
          value="addToCart"
          className="min-h-11 w-full cursor-pointer border border-white/20 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:text-gray-500"
          disabled={isPending}
        >
          장바구니 담기
        </button>
        <button
          type="submit"
          name="intent"
          value="orderNow"
          className="min-h-11 w-full cursor-pointer bg-amber-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-amber-700"
          disabled={isPending}
        >
          바로 주문
        </button>
      </div>
    </form>
  );
}
