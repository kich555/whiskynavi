"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  getApiV2AdminOrdersOrderIdShipmentNotificationHistory,
  getApiV2AdminShipmentNotifications,
  postApiV2AdminOrdersOrderIdShipmentNotificationsIdRetry,
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

export async function loadShipmentNotifications(orderId?: number, failedOnly = false, beforeId?: number) {
  const options = await adminOptions();
  if (orderId !== undefined) requireId(orderId);
  if (beforeId !== undefined) requireId(beforeId);
  return (await getApiV2AdminShipmentNotifications({ orderId, failedOnly, beforeId }, options)).data;
}

export async function loadShipmentNotificationHistory(orderId: number, beforeId?: number) {
  const options = await adminOptions();
  requireId(orderId);
  if (beforeId !== undefined) requireId(beforeId);
  return (await getApiV2AdminOrdersOrderIdShipmentNotificationHistory(orderId, { beforeId }, options)).data;
}

export async function recoverShipmentNotification(orderId: number, input: { notificationId: number; reason: string }) {
  try {
    const options = await adminOptions();
    requireId(orderId);
    const reason = typeof input.reason === "string" ? input.reason.trim() : "";
    if (!reason || reason.length > 200) throw new NotificationActionError("처리 사유를 200자 이내로 입력해 주세요.");
    requireId(input.notificationId);
    await postApiV2AdminOrdersOrderIdShipmentNotificationsIdRetry(orderId, input.notificationId, { reason }, options);
    revalidatePath(`/admin/general-item-orders/${orderId}`);
    revalidatePath("/admin/general-item-orders/shipment-notifications");
    return { success: true as const };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false as const,
      error:
        error instanceof NotificationActionError
          ? error.message
          : getUserErrorMessage(error, "출고 알림 처리에 실패했습니다."),
    };
  }
}
