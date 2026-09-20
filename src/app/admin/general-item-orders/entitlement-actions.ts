"use server";
import { getUserErrorMessage } from "@/apis/errors";
import {
  getApiV2AdminOrdersOrderIdEntitlements,
  postApiV2AdminOrdersOrderIdEntitlementsIdUse,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
class EntitlementActionError extends Error {}
async function adminOptions() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) throw new EntitlementActionError("인증이 만료되었습니다. 다시 로그인해 주세요.");
  if (!session.user.roles?.includes("ROLE_ADMIN")) throw new EntitlementActionError("관리자 권한이 필요합니다.");
  return withToken(session.accessToken);
}
function id(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new EntitlementActionError("올바른 주문·이용권 번호가 필요합니다.");
}
export async function loadAdminEntitlements(orderId: number) {
  const options = await adminOptions();
  id(orderId);
  return (await getApiV2AdminOrdersOrderIdEntitlements(orderId, { ...options, cache: "no-store" })).data;
}
export async function markServiceEntitlementUsed(orderId: number, entitlementId: number, reason: string) {
  try {
    const options = await adminOptions();
    id(orderId);
    id(entitlementId);
    if (typeof reason !== "string" || !reason.trim() || reason.trim().length > 500)
      throw new EntitlementActionError("이용 확인 사유를 500자 이내로 입력해 주세요.");
    await postApiV2AdminOrdersOrderIdEntitlementsIdUse(orderId, entitlementId, { reason: reason.trim() }, options);
    revalidatePath(`/admin/general-item-orders/${orderId}`);
    revalidatePath("/admin/service-entitlements");
    return { success: true as const };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false as const,
      error:
        error instanceof EntitlementActionError
          ? error.message
          : getUserErrorMessage(error, "사용 처리에 실패했습니다."),
    };
  }
}
