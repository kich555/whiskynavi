"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  postApiAdminReservationsBusinessPickupLocationClear,
  putApiAdminReservationsBusinessPickupLocation,
  type BusinessReservationPickupSettingResponse,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";

export type BusinessPickupSettingActionResult = {
  success: boolean;
  data?: BusinessReservationPickupSettingResponse;
  error?: string;
};

const reasonSchema = z
  .string()
  .trim()
  .min(1, "변경 사유를 입력해 주세요.")
  .max(500, "변경 사유는 500자 이하여야 합니다.");

export async function updateBusinessPickupSettingAction(
  businessId: number,
  reason: string,
): Promise<BusinessPickupSettingActionResult> {
  const parsed = z
    .object({
      businessId: z.number().int().positive("픽업 업장을 선택해 주세요."),
      reason: reasonSchema,
    })
    .safeParse({ businessId, reason });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "관리자 로그인이 필요합니다." };
    }
    const response = await putApiAdminReservationsBusinessPickupLocation(parsed.data, withToken(token));
    revalidatePath("/admin/reservations/business-pickup-location");
    return { success: true, data: response.data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "비즈니스 예약 픽업 업장 지정에 실패했습니다."),
    };
  }
}

export async function clearBusinessPickupSettingAction(reason: string): Promise<BusinessPickupSettingActionResult> {
  const parsed = reasonSchema.safeParse(reason);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "관리자 로그인이 필요합니다." };
    }
    const response = await postApiAdminReservationsBusinessPickupLocationClear(
      { reason: parsed.data },
      withToken(token),
    );
    revalidatePath("/admin/reservations/business-pickup-location");
    return { success: true, data: response.data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "비즈니스 예약 픽업 업장 해제에 실패했습니다."),
    };
  }
}
