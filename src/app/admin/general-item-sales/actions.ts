"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  getApiAdminSalesSaleid,
  patchApiAdminSalesSaleid,
  type AdminSaleAnnouncementResponse,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { parseSaleUpdate } from "./_lib/sale-update";

export type SaleUpdateResult = { success: boolean; error?: string; data?: AdminSaleAnnouncementResponse };

export async function updateGeneralItemSale(saleId: number, formData: FormData): Promise<SaleUpdateResult> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken || session.error)
    return { success: false, error: "인증이 만료되었습니다. 다시 로그인해 주세요." };
  if (!session.user.roles?.includes("ROLE_ADMIN")) return { success: false, error: "관리자 권한이 필요합니다." };
  if (!Number.isSafeInteger(saleId) || saleId <= 0) return { success: false, error: "공고 ID가 올바르지 않습니다." };

  const parsed = parseSaleUpdate(formData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." };

  try {
    const options = { ...withToken(session.accessToken), cache: "no-store" as const };
    const { data: sale } = await getApiAdminSalesSaleid(saleId, options);
    if (sale.productType !== "ITEM" || sale.saleType !== "GENERAL") {
      return { success: false, error: "일반상품 판매공고가 아닙니다." };
    }
    const result = await patchApiAdminSalesSaleid(saleId, parsed.data, options);
    revalidatePath("/admin/general-item-sales");
    revalidatePath(`/admin/general-item-sales/${saleId}`);
    revalidatePath("/general-items");
    revalidatePath(`/general-items/${saleId}`);
    revalidatePath("/general-items/cart");
    revalidatePath("/general-items/cart/order");
    return { success: true, data: result.data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: getUserErrorMessage(error, "판매공고 수정에 실패했습니다.") };
  }
}
