"use server";

import { getUserErrorMessage } from "@/apis/errors";
import { patchApiAdminUsersIdRolesAdd, postApiV2AdminUsersPurchaseStatisticsRefresh } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export type CommunityMembershipBrand = "navi" | "tales";

const COMMUNITY_MEMBERSHIP_ROLE = {
  navi: "ROLE_WHISKYNAVI_MEMBER",
  tales: "ROLE_WHISKYTALES_MEMBER",
} as const;

export type RequestPurchaseStatisticsRefreshResult =
  | {
      success: true;
      requestId: string | null;
      statisticsYear: number;
    }
  | {
      success: false;
      error: string;
    };

export async function requestPurchaseStatisticsRefreshAction(): Promise<RequestPurchaseStatisticsRefreshResult> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "인증이 필요합니다." };
    }

    const response = await postApiV2AdminUsersPurchaseStatisticsRefresh(withToken(token));
    if (!response.data.accepted) {
      return {
        success: false,
        error: "통계 갱신 큐가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.",
      };
    }

    return {
      success: true,
      requestId: response.data.requestId ?? null,
      statisticsYear: response.data.statisticsYear ?? new Date().getFullYear(),
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "통계 갱신 요청을 접수하지 못했습니다."),
    };
  }
}

export type GrantCommunityMembershipResult =
  | { success: true }
  | {
      success: false;
      error: string;
    };

export async function grantCommunityMembershipAction(
  userId: number,
  brand: CommunityMembershipBrand,
): Promise<GrantCommunityMembershipResult> {
  if (!Number.isInteger(userId) || userId <= 0) {
    return { success: false, error: "유효하지 않은 사용자입니다." };
  }
  if (brand !== "navi" && brand !== "tales") {
    return { success: false, error: "유효하지 않은 커뮤니티 등급입니다." };
  }

  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "인증이 필요합니다." };
    }

    await patchApiAdminUsersIdRolesAdd(userId, { roles: [COMMUNITY_MEMBERSHIP_ROLE[brand]] }, withToken(token));
    revalidatePath("/admin/user-purchase-statistics");
    revalidatePath("/admin/membership");
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "커뮤니티 등급을 부여하지 못했습니다."),
    };
  }
}
