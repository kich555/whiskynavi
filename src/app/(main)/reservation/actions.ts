"use server";

import {
  getApiBottlesReservationsNoticesNoticeid,
  postApiBottlesReservationsNoticesNoticeidApplications,
} from "@/apis/generated/api";
import { getUserErrorMessage } from "@/apis/errors";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getNoticeStatus } from "./_lib/utils";

export async function applyReservation(
  noticeId: number,
  quantity: number,
  userBusinessId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    if (quantity < 1 || quantity > 10) {
      return { success: false, error: "수량은 1~10병 사이로 입력해주세요." };
    }

    // 클라이언트가 보내는 상태는 신뢰하지 않고, 신청 시점의 예약 기간을 서버에서 다시 검증한다.
    const { data: notice } = await getApiBottlesReservationsNoticesNoticeid(noticeId);
    if (getNoticeStatus(notice) !== "active") {
      return { success: false, error: "지금은 예약 신청 기간이 아닙니다." };
    }

    await postApiBottlesReservationsNoticesNoticeidApplications(
      noticeId,
      { quantity, userBusinessId },
      withToken(token),
    );

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "예약 신청에 실패했습니다."),
    };
  }
}
