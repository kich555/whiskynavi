"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  deleteApiBottlesReservationsApplicationsApplicationid,
  getApiBottlesReservationsNoticesNoticeid,
  postApiBottlesReservationsNoticesNoticeidApplications,
  putApiBottlesReservationsApplicationsApplicationid,
  type UserBottleReservationApplicationPublicResponse,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getNoticeStatus, type NoticeStatus } from "./_lib/utils";

const RESERVATION_ENDED_MUTATION_MESSAGE = "예약이 종료된 후에는 수정/취소가 불가능합니다.";

function getReservationMutationWindowError(status: NoticeStatus): string | null {
  if (status === "active") return null;
  return RESERVATION_ENDED_MUTATION_MESSAGE;
}

export async function applyReservation(
  noticeId: number,
  quantity: number,
  userBusinessId: number,
): Promise<{ success: boolean; error?: string; application?: UserBottleReservationApplicationPublicResponse }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 클라이언트가 보내는 값은 신뢰하지 않고, 신청 시점의 최대 신청 병수를 서버에서 다시 검증한다.
    const { data: notice } = await getApiBottlesReservationsNoticesNoticeid(noticeId, withToken(token));
    const maxOrderQuantity = notice.maxOrderQuantity ?? 100;
    if (quantity < 1 || quantity > maxOrderQuantity) {
      return { success: false, error: `수량은 1~${maxOrderQuantity}병 사이로 입력해주세요.` };
    }
    // 클라이언트가 보내는 상태는 신뢰하지 않고, 신청 시점의 예약 기간을 서버에서 다시 검증한다.
    if (getNoticeStatus(notice) !== "active") {
      return { success: false, error: "지금은 예약 신청 기간이 아닙니다." };
    }

    const { data: application } = await postApiBottlesReservationsNoticesNoticeidApplications(
      noticeId,
      { quantity, userBusinessId },
      withToken(token),
    );

    return { success: true, application };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "예약 신청에 실패했습니다."),
    };
  }
}

export async function updateReservation(
  noticeId: number,
  applicationId: number,
  quantity: number,
  userBusinessId: number,
): Promise<{ success: boolean; error?: string; application?: UserBottleReservationApplicationPublicResponse }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 클라이언트가 보내는 값은 신뢰하지 않고, 수정 시점의 최대 신청 병수를 서버에서 다시 검증한다.
    const { data: notice } = await getApiBottlesReservationsNoticesNoticeid(noticeId, withToken(token));
    const maxOrderQuantity = notice.maxOrderQuantity ?? 100;
    if (quantity < 1 || quantity > maxOrderQuantity) {
      return { success: false, error: `수량은 1~${maxOrderQuantity}병 사이로 입력해주세요.` };
    }

    // 클라이언트가 보내는 상태는 신뢰하지 않고, 수정 시점의 예약 기간을 서버에서 다시 검증한다.
    const windowError = getReservationMutationWindowError(getNoticeStatus(notice));
    if (windowError) {
      return { success: false, error: windowError };
    }

    const { data: application } = await putApiBottlesReservationsApplicationsApplicationid(
      applicationId,
      { quantity, userBusinessId },
      withToken(token),
    );

    return { success: true, application };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "예약 신청 수정에 실패했습니다."),
    };
  }
}

export async function cancelReservation(
  noticeId: number,
  applicationId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // 클라이언트가 보내는 상태는 신뢰하지 않고, 취소 시점의 예약 기간을 서버에서 다시 검증한다.
    const { data: notice } = await getApiBottlesReservationsNoticesNoticeid(noticeId, withToken(token));
    const windowError = getReservationMutationWindowError(getNoticeStatus(notice));
    if (windowError) {
      return { success: false, error: windowError };
    }

    await deleteApiBottlesReservationsApplicationsApplicationid(applicationId, withToken(token));

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "예약 신청 취소에 실패했습니다."),
    };
  }
}
