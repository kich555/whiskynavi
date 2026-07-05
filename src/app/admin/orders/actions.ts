"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  getApiAdminOrdersDeliveryExport,
  patchApiAdminOrdersOrderidDelivery,
  patchApiAdminOrdersOrderidDeliveryComplete,
  patchApiAdminOrdersOrderidDeliveryShip,
  patchApiAdminOrdersOrderidStatus,
  postApiAdminOrdersDeliveryImport,
  postApiAdminOrdersDeliveryImportResultCsv,
  type AdminDeliveryCsvUploadResponse,
  type OrderDeliveryUpdateRequest,
  type OrderStatusUpdateRequestOrderStatus,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";

const DEFAULT_CARRIER_NAME = "CJ대한통운";

type AdminOrderActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

function revalidateAdminOrderPages() {
  revalidatePath("/admin/orders");
  revalidatePath("/admin/general-item-orders");
  revalidatePath("/admin/bottle-orders");
}

async function getAdminOptions(): Promise<RequestInit | null> {
  const token = await getAuthToken();
  return token ? (withToken(token) ?? null) : null;
}

export async function shipAdminOrderDelivery(
  orderId: number,
  input: { carrierName?: string; trackingNumber?: string },
) {
  try {
    const options = await getAdminOptions();
    if (!options) return { success: false, error: "인증이 필요합니다." };

    const trackingNumber = input.trackingNumber?.trim();
    if (!trackingNumber) {
      return { success: false, error: "운송장번호를 입력해주세요." };
    }

    await patchApiAdminOrdersOrderidDeliveryShip(
      orderId,
      {
        carrierName: input.carrierName?.trim() || DEFAULT_CARRIER_NAME,
        trackingNumber,
      },
      options,
    );

    revalidateAdminOrderPages();
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "발송 처리에 실패했습니다."),
    };
  }
}

export async function updateAdminOrderDelivery(
  orderId: number,
  input: OrderDeliveryUpdateRequest,
): Promise<AdminOrderActionResult> {
  try {
    const options = await getAdminOptions();
    if (!options) return { success: false, error: "인증이 필요합니다." };

    await patchApiAdminOrdersOrderidDelivery(orderId, input, options);
    revalidateAdminOrderPages();
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "배송 정보 수정에 실패했습니다."),
    };
  }
}

export async function completeAdminOrderDelivery(orderId: number, deliveredAt?: string) {
  try {
    const options = await getAdminOptions();
    if (!options) return { success: false, error: "인증이 필요합니다." };

    await patchApiAdminOrdersOrderidDeliveryComplete(
      orderId,
      { deliveredAt: deliveredAt?.trim() || undefined },
      options,
    );
    revalidateAdminOrderPages();
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "배송 완료 처리에 실패했습니다."),
    };
  }
}

export async function updateAdminOrderStatus(orderId: number, orderStatus: string, reason?: string) {
  try {
    const options = await getAdminOptions();
    if (!options) return { success: false, error: "인증이 필요합니다." };

    await patchApiAdminOrdersOrderidStatus(
      orderId,
      {
        orderStatus: orderStatus as OrderStatusUpdateRequestOrderStatus,
        reason: reason?.trim() || undefined,
      },
      options,
    );

    revalidateAdminOrderPages();
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "주문 상태 변경에 실패했습니다."),
    };
  }
}

export async function exportAdminDeliveryCsv(): Promise<AdminOrderActionResult<string>> {
  try {
    const options = await getAdminOptions();
    if (!options) return { success: false, error: "인증이 필요합니다." };

    const response = await getApiAdminOrdersDeliveryExport(
      {
        productType: "ITEM",
        fulfillmentMethod: "DIRECT_DELIVERY",
        saleTiming: "IMMEDIATE",
      },
      options,
    );

    return { success: true, data: response.data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "배송 CSV 다운로드에 실패했습니다."),
    };
  }
}

export async function uploadAdminDeliveryCsv(
  file: File,
  dryRun: boolean,
): Promise<AdminOrderActionResult<AdminDeliveryCsvUploadResponse>> {
  try {
    const options = await getAdminOptions();
    if (!options) return { success: false, error: "인증이 필요합니다." };

    if (!file || file.size === 0) {
      return { success: false, error: "CSV 파일을 선택해주세요." };
    }

    const response = await postApiAdminOrdersDeliveryImport({ file }, { dryRun }, options);
    revalidateAdminOrderPages();
    return { success: true, data: response.data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "배송 CSV 업로드에 실패했습니다."),
    };
  }
}

export async function downloadAdminDeliveryCsvResult(
  file: File,
  dryRun: boolean,
): Promise<AdminOrderActionResult<string>> {
  try {
    const options = await getAdminOptions();
    if (!options) return { success: false, error: "인증이 필요합니다." };

    if (!file || file.size === 0) {
      return { success: false, error: "CSV 파일을 선택해주세요." };
    }

    const response = await postApiAdminOrdersDeliveryImportResultCsv({ file }, { dryRun }, options);
    return { success: true, data: response.data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "배송 CSV 결과 다운로드에 실패했습니다."),
    };
  }
}
