"use server";
import { getUserErrorMessage } from "@/apis/errors";
import { postApiV2OrdersEntitlementsLookup, postApiV2OrdersEntitlementsUse } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function lookupServiceEntitlements(orderId: number, guestOrderToken?: string) {
  if (!Number.isSafeInteger(orderId) || orderId <= 0)
    return { success: false as const, error: "주문번호를 확인해 주세요." };
  const token = await getAuthToken();
  if (!token && !guestOrderToken)
    return { success: false as const, error: "다시 로그인하거나 비회원 조회 코드를 입력해 주세요." };
  try {
    const result = await postApiV2OrdersEntitlementsLookup(
      { orderId, guestOrderToken },
      { ...withToken(token), cache: "no-store" },
    );
    return { success: true as const, data: result.data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false as const, error: getUserErrorMessage(error, "이용권 조회에 실패했습니다.") };
  }
}

export async function completeMyServiceEntitlement(orderId: number, entitlementId: number, guestOrderToken?: string) {
  if (![orderId, entitlementId].every((id) => Number.isSafeInteger(id) && id > 0))
    return { success: false as const, error: "주문번호와 이용권 번호를 확인해 주세요." };
  const token = await getAuthToken();
  if (!token && !guestOrderToken)
    return { success: false as const, error: "다시 로그인하거나 비회원 조회 코드를 입력해 주세요." };
  try {
    await postApiV2OrdersEntitlementsUse(
      { orderId, entitlementId, guestOrderToken },
      { ...withToken(token), cache: "no-store" },
    );
    return { success: true as const };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false as const, error: getUserErrorMessage(error, "사용 완료 처리에 실패했습니다.") };
  }
}
