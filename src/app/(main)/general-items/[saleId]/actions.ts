"use server";

import { getApiSalesSaleid } from "@/apis/generated/api";
import { redirect } from "next/navigation";
import { addGeneralItemToCart } from "../cart/actions";

export type CartFormState = {
  success: boolean;
  error?: string;
};

export async function addToCartFormAction(_prevState: CartFormState, formData: FormData): Promise<CartFormState> {
  const saleAnnouncementId = Number(formData.get("saleAnnouncementId"));
  const quantity = Number(formData.get("quantity"));
  const intent = String(formData.get("intent"));

  if (
    !Number.isSafeInteger(saleAnnouncementId) ||
    saleAnnouncementId <= 0 ||
    !Number.isSafeInteger(quantity) ||
    quantity <= 0
  ) {
    return { success: false, error: "상품과 수량을 확인해 주세요." };
  }
  if (intent === "orderNow") {
    let serviceProduct: boolean;
    try {
      serviceProduct =
        (await getApiSalesSaleid(saleAnnouncementId, { cache: "no-store" })).data.serviceProduct === true;
    } catch {
      return { success: false, error: "상품 정보를 확인하지 못했습니다. 다시 시도해 주세요." };
    }
    if (!serviceProduct) redirect(`/general-items/delivery-order?saleId=${saleAnnouncementId}&quantity=${quantity}`);
  }

  const result = await addGeneralItemToCart({ saleAnnouncementId, quantity });

  if (!result.success) {
    return { success: false, error: result.error ?? "장바구니 담기에 실패했습니다." };
  }

  if (intent === "orderNow") {
    redirect("/general-items/cart/order");
  }

  return { success: true };
}
