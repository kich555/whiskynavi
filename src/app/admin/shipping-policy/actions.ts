"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  putApiAdminShippingPolicy as updateAdminShippingPolicy,
  type ShippingPolicyResponse,
  type ShippingPolicyUpdateRequest,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";

export type ShippingPolicyActionState = {
  success: boolean;
  data?: ShippingPolicyResponse;
  error?: string;
};

function parseCurrencyField(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? Number.NaN : Number(value);
}

const shippingPolicySchema = z.object({
  enabled: z.boolean(),
  baseShippingFee: z
    .number()
    .int("기본 배송비는 원 단위 정수로 입력해 주세요.")
    .min(0, "기본 배송비는 0원 이상이어야 합니다."),
  freeShippingThreshold: z
    .number()
    .int("무료배송 기준 금액은 원 단위 정수로 입력해 주세요.")
    .min(0, "무료배송 기준 금액은 0원 이상이어야 합니다."),
});

export async function updateShippingPolicyAction(
  _prevState: ShippingPolicyActionState,
  formData: FormData,
): Promise<ShippingPolicyActionState> {
  const values = {
    enabled: formData.get("enabled") === "on",
    baseShippingFee: parseCurrencyField(formData, "baseShippingFee"),
    freeShippingThreshold: parseCurrencyField(formData, "freeShippingThreshold"),
  };

  if (!Number.isFinite(values.baseShippingFee)) {
    return {
      success: false,
      error: "기본 배송비를 입력해 주세요.",
    };
  }

  if (!Number.isFinite(values.freeShippingThreshold)) {
    return {
      success: false,
      error: "무료배송 기준 금액을 입력해 주세요.",
    };
  }

  const parsed = shippingPolicySchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  try {
    const token = await getAuthToken();
    const body: ShippingPolicyUpdateRequest = parsed.data;
    const res = await updateAdminShippingPolicy(body, withToken(token));

    revalidatePath("/admin/shipping-policy");

    return {
      success: true,
      data: res.data,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: getUserErrorMessage(error, "배송비 정책 저장에 실패했습니다."),
    };
  }
}
