"use server";
import { getUserErrorMessage } from "@/apis/errors";
import { getApiV2AdminServiceEntitlements, type GetApiV2AdminServiceEntitlementsParams } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { entitlementStatusLabels, type EntitlementSearchParams } from "./filters";

export async function loadServiceEntitlements(params: EntitlementSearchParams) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return { success: false as const, error: "인증이 만료되었습니다. 다시 로그인해 주세요." };
  if (!session.user.roles?.includes("ROLE_ADMIN"))
    return { success: false as const, error: "관리자 권한이 필요합니다." };
  if (
    !params ||
    [params.keyword, params.status, params.entitlementId, params.orderId, params.beforeId].some(
      (v) => v != null && typeof v !== "string",
    )
  )
    return { success: false as const, error: "검색 조건을 확인해 주세요." };
  const keyword = params.keyword?.trim() || undefined;
  if (keyword && keyword.length > 100)
    return { success: false as const, error: "검색어는 100자 이내로 입력해 주세요." };
  if (params.status && !Object.hasOwn(entitlementStatusLabels, params.status))
    return { success: false as const, error: "이용권 상태를 확인해 주세요." };
  for (const value of [params.entitlementId, params.orderId, params.beforeId]) {
    if (value && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0))
      return { success: false as const, error: "주문·이용권·페이지 번호는 양수로 입력해 주세요." };
  }
  const query: GetApiV2AdminServiceEntitlementsParams = {
    keyword,
    status: (params.status || undefined) as GetApiV2AdminServiceEntitlementsParams["status"],
    entitlementId: params.entitlementId ? Number(params.entitlementId) : undefined,
    orderId: params.orderId ? Number(params.orderId) : undefined,
    beforeId: params.beforeId ? Number(params.beforeId) : undefined,
  };
  try {
    const response = await getApiV2AdminServiceEntitlements(query, {
      ...withToken(session.accessToken),
      cache: "no-store",
    });
    return { success: true as const, data: response.data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false as const,
      error: getUserErrorMessage(error, "이용권 목록을 불러오지 못했습니다. 다시 시도해 주세요."),
    };
  }
}
