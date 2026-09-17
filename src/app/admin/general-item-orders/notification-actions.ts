"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  getApiV2AdminGuestNotifications,
  getApiV2AdminOrdersOrderIdGuestNotificationHistory,
  postApiV2AdminOrdersOrderIdGuestNotificationsIdRetry,
  postApiV2AdminOrdersOrderIdGuestTokenReissue,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";

class NotificationActionError extends Error {}

async function adminOptions() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) throw new NotificationActionError("인증이 만료되었습니다. 다시 로그인해 주세요.");
  if (!session.user.roles?.includes("ROLE_ADMIN")) throw new NotificationActionError("관리자 권한이 필요합니다.");
  return withToken(session.accessToken);
}

function requireId(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new NotificationActionError("올바른 주문 또는 발송 ID가 필요합니다.");
}

export async function loadGuestNotifications(orderId?: number, failedOnly = false, beforeId?: number) {
  const options = await adminOptions();
  if (orderId !== undefined) requireId(orderId);
  if (beforeId !== undefined) requireId(beforeId);
  return (await getApiV2AdminGuestNotifications({ orderId, failedOnly, beforeId }, options)).data;
}

export async function loadGuestNotificationHistory(orderId: number, beforeId?: number) {
  const options = await adminOptions();
  requireId(orderId);
  if (beforeId !== undefined) requireId(beforeId);
  return (await getApiV2AdminOrdersOrderIdGuestNotificationHistory(orderId, { beforeId }, options)).data;
}

export async function recoverGuestNotification(
  orderId: number,
  input:
    | { action: "retry"; notificationId: number; reason: string }
    | { action: "reissue"; identityConfirmed: boolean; reason: string },
) {
  try {
    const options = await adminOptions();
    requireId(orderId);
    const reason = typeof input.reason === "string" ? input.reason.trim() : "";
    if (!reason || reason.length > 200) throw new NotificationActionError("처리 사유를 200자 이내로 입력해 주세요.");
    if (input.action === "retry") {
      requireId(input.notificationId);
      await postApiV2AdminOrdersOrderIdGuestNotificationsIdRetry(orderId, input.notificationId, { reason }, options);
    } else if (input.action === "reissue") {
      if (input.identityConfirmed !== true) throw new NotificationActionError("주문자 본인 확인을 완료해 주세요.");
      await postApiV2AdminOrdersOrderIdGuestTokenReissue(orderId, { reason, identityConfirmed: true }, options);
    } else {
      throw new NotificationActionError("지원하지 않는 요청입니다.");
    }
    revalidatePath(`/admin/general-item-orders/${orderId}`);
    revalidatePath("/admin/general-item-orders/notifications");
    return { success: true as const };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false as const,
      error:
        error instanceof NotificationActionError
          ? error.message
          : getUserErrorMessage(error, "비회원 안내 처리에 실패했습니다."),
    };
  }
}
