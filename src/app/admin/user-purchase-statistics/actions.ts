"use server";

import { getUserErrorMessage } from "@/apis/errors";
import { postApiV2AdminUsersPurchaseStatisticsRefresh } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

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
