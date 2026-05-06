"use server";

import {
  type BottleReservationPickupWaitingPickupRequest,
  postApiUsersBusinessesPickupReservationsApplicationsApplicationidPaymentComplete,
  postApiUsersBusinessesPickupReservationsApplicationsApplicationidReceiveComplete,
  postApiUsersBusinessesPickupReservationsApplicationsApplicationidWaitingPickup,
  postApiUsersBusinessesPickupReservationsApplicationsWaitingPickup,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ActionResult = { success: boolean; error?: string };

export async function paymentCompleteAction(applicationId: number): Promise<ActionResult> {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  try {
    await postApiUsersBusinessesPickupReservationsApplicationsApplicationidPaymentComplete(
      applicationId,
      withToken(token),
    );
    revalidatePath("/business/pickup-reservations");
    revalidatePath(`/business/pickup-reservations/${applicationId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "결제완료 처리에 실패했습니다.";
    return { success: false, error: message };
  }
}

export async function waitingPickupAction(applicationId: number): Promise<ActionResult> {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  try {
    await postApiUsersBusinessesPickupReservationsApplicationsApplicationidWaitingPickup(
      applicationId,
      withToken(token),
    );
    revalidatePath("/business/pickup-reservations");
    revalidatePath(`/business/pickup-reservations/${applicationId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "픽업대기 처리에 실패했습니다.";
    return { success: false, error: message };
  }
}

export async function receiveCompleteAction(applicationId: number): Promise<ActionResult> {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  try {
    await postApiUsersBusinessesPickupReservationsApplicationsApplicationidReceiveComplete(
      applicationId,
      withToken(token),
    );
    revalidatePath("/business/pickup-reservations");
    revalidatePath(`/business/pickup-reservations/${applicationId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "수령완료 처리에 실패했습니다.";
    return { success: false, error: message };
  }
}

export async function bulkWaitingPickupAction(
  request: BottleReservationPickupWaitingPickupRequest,
): Promise<ActionResult> {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  try {
    await postApiUsersBusinessesPickupReservationsApplicationsWaitingPickup(request, withToken(token));
    revalidatePath("/business/pickup-reservations");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "일괄 픽업대기 처리에 실패했습니다.";
    return { success: false, error: message };
  }
}
