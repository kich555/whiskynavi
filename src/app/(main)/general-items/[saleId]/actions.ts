"use server";

import { redirect } from "next/navigation";
import { addGeneralItemToCart } from "../cart/actions";

export type CartFormState = {
  success: boolean;
  error?: string;
};

export async function addToCartFormAction(
  _prevState: CartFormState,
  formData: FormData,
): Promise<CartFormState> {
  const saleAnnouncementId = Number(formData.get("saleAnnouncementId"));
  const quantity = Number(formData.get("quantity"));
  const intent = String(formData.get("intent"));

  const result = await addGeneralItemToCart({ saleAnnouncementId, quantity });

  if (!result.success) {
    return { success: false, error: result.error ?? "장바구니 담기에 실패했습니다." };
  }

  if (intent === "orderNow") {
    redirect("/general-items/cart/order");
  }

  return { success: true };
}
