"use server";

import { getUserErrorMessage } from "@/apis/errors";
import {
  getApiOrdersGuest,
  patchApiOrdersGuestOrdernumberCancel,
  postApiOrdersGeneralItemsDeliveryTossConfirm,
  postApiOrdersGeneralItemsDeliveryTossTickets,
  postApiUsersMeDeliveryAddresses,
  type GeneralItemDeliveryTicketResponse,
  type PostApiUsersMeDeliveryAddressesBody,
  type UserDeliveryAddressResponse,
  type UserGeneralItemDeliveryOrderResponse,
  type UserOrderResponse,
} from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type GeneralItemDeliveryOrderInput = {
  saleAnnouncementId: number;
  requestedQuantity: number;
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  deliveryMemo?: string;
  orderNote?: string;
  guestEmail: string;
};

const orderInputSchema = z.object({
  saleAnnouncementId: z.number().int().positive("판매 공고 정보가 올바르지 않습니다."),
  requestedQuantity: z.number().int().positive("수량을 다시 선택해 주세요."),
  receiverName: z.string().trim().min(1, "수령인 이름을 입력해주세요.").max(100),
  receiverPhone: z.string().trim().min(1, "수령인 연락처를 입력해주세요.").max(20),
  deliveryAddress: z.string().trim().min(1, "배송 주소를 입력해주세요.").max(500),
  deliveryMemo: z.string().trim().max(500).optional(),
  orderNote: z.string().trim().max(500).optional(),
  guestEmail: z
    .string()
    .trim()
    .min(1, "주문 안내를 받을 이메일을 입력해주세요.")
    .email("올바른 이메일 형식이 아닙니다.")
    .max(100),
});

const tossConfirmSchema = z.object({
  orderId: z.string().trim().min(1, "토스 주문번호가 없습니다."),
  paymentKey: z.string().trim().min(1, "토스 결제 키가 없습니다."),
  amount: z.coerce.number().int().positive("결제 금액이 올바르지 않습니다."),
});

const guestLookupSchema = z.object({
  orderNumber: z.string().trim().min(1, "주문번호를 입력해주세요."),
  guestOrderToken: z.string().trim().min(1, "비회원 주문 조회 코드를 입력해주세요."),
});

const guestCancelSchema = guestLookupSchema.extend({
  reason: z.string().trim().max(500).optional(),
});

const deliveryAddressSchema = z.object({
  addressName: z.string().trim().min(1, "배송지 이름을 입력해주세요.").max(100),
  receiverName: z.string().trim().min(1, "수령인 이름을 입력해주세요.").max(100),
  receiverPhone: z.string().trim().min(1, "수령인 연락처를 입력해주세요.").max(20),
  postalCode: z.string().trim().max(20).optional(),
  address: z.string().trim().min(1, "기본 주소를 입력해주세요.").max(500),
  addressDetail: z.string().trim().max(500).optional(),
  deliveryMemo: z.string().trim().max(500).optional(),
  defaultAddress: z.boolean().optional(),
});

function normalizeOptionalText(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeOrderInput(input: GeneralItemDeliveryOrderInput): GeneralItemDeliveryOrderInput {
  return {
    saleAnnouncementId: input.saleAnnouncementId,
    requestedQuantity: input.requestedQuantity,
    receiverName: input.receiverName.trim(),
    receiverPhone: input.receiverPhone.trim(),
    deliveryAddress: input.deliveryAddress.trim(),
    deliveryMemo: normalizeOptionalText(input.deliveryMemo),
    orderNote: normalizeOptionalText(input.orderNote),
    guestEmail: input.guestEmail.trim(),
  };
}

function normalizeDeliveryAddressInput(
  input: z.infer<typeof deliveryAddressSchema>,
): PostApiUsersMeDeliveryAddressesBody {
  return {
    addressName: input.addressName.trim(),
    receiverName: input.receiverName.trim(),
    receiverPhone: input.receiverPhone.trim(),
    postalCode: normalizeOptionalText(input.postalCode),
    address: input.address.trim(),
    addressDetail: normalizeOptionalText(input.addressDetail),
    deliveryMemo: normalizeOptionalText(input.deliveryMemo),
    defaultAddress: input.defaultAddress ?? false,
  };
}

async function buildOptions(idempotencyKey?: string): Promise<RequestInit | undefined> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  return Object.keys(headers).length > 0 ? { headers } : undefined;
}

function guideErrorMessage(error: unknown, fallback: string): string {
  const message = getUserErrorMessage(error, fallback);

  if (message.includes("주문 티켓이 만료")) {
    return "결제 가능 시간이 만료되었습니다. 주문을 다시 시도해 주세요.";
  }

  if (message.includes("권한") || message.includes("role") || message.includes("Role")) {
    return "이 상품을 주문할 권한이 없습니다. 로그인 계정 또는 회원 등급을 확인해 주세요.";
  }

  if (message.includes("남은 수량") || message.includes("Insufficient available quantity")) {
    return "남은 수량이 부족합니다. 수량을 다시 선택해 주세요.";
  }

  if (message.includes("조회 코드") || message.includes("guestOrderToken")) {
    return "주문번호 또는 조회 코드가 올바르지 않습니다.";
  }

  return message;
}

export async function createDeliveryAddress(
  input: PostApiUsersMeDeliveryAddressesBody,
): Promise<ActionResult<UserDeliveryAddressResponse>> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "배송지를 저장하려면 로그인이 필요합니다." };
    }

    const parsed = deliveryAddressSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const response = await postApiUsersMeDeliveryAddresses(normalizeDeliveryAddressInput(parsed.data), {
      headers: {
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      },
    });

    revalidatePath("/general-items/cart/order");
    return { success: true, data: response.data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: guideErrorMessage(error, "배송지 저장에 실패했습니다."),
    };
  }
}

export type AddressFormState =
  | { success: true; data: UserDeliveryAddressResponse }
  | { success: false; error?: string };

export async function createDeliveryAddressFormAction(
  _prevState: AddressFormState,
  formData: FormData,
): Promise<AddressFormState> {
  const result = await createDeliveryAddress({
    addressName: String(formData.get("addressName") ?? ""),
    receiverName: String(formData.get("receiverName") ?? ""),
    receiverPhone: String(formData.get("receiverPhone") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    address: String(formData.get("address") ?? ""),
    addressDetail: String(formData.get("addressDetail") ?? ""),
    deliveryMemo: String(formData.get("deliveryMemo") ?? ""),
    defaultAddress: formData.get("defaultAddress") === "on",
  });

  if (!result.success || !result.data) {
    return { success: false, error: result.error ?? "배송지 저장에 실패했습니다." };
  }

  return { success: true, data: result.data };
}

export async function createGeneralItemTossTicket(
  input: GeneralItemDeliveryOrderInput,
  idempotencyKey: string,
): Promise<ActionResult<GeneralItemDeliveryTicketResponse>> {
  try {
    const parsed = orderInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const response = await postApiOrdersGeneralItemsDeliveryTossTickets(
      normalizeOrderInput(parsed.data),
      await buildOptions(idempotencyKey),
    );

    return { success: true, data: response.data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: guideErrorMessage(error, "토스 결제 준비에 실패했습니다."),
    };
  }
}

export async function confirmGeneralItemTossPayment(input: {
  orderId?: string;
  paymentKey?: string;
  amount?: string;
}): Promise<ActionResult<UserGeneralItemDeliveryOrderResponse>> {
  try {
    const parsed = tossConfirmSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const options = await buildOptions();
    const body = {
      pgOrderId: parsed.data.orderId,
      paymentKey: parsed.data.paymentKey,
      amount: parsed.data.amount,
    };
    const response = options
      ? await postApiOrdersGeneralItemsDeliveryTossConfirm(body, options)
      : await postApiOrdersGeneralItemsDeliveryTossConfirm(body);

    return { success: true, data: response.data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: guideErrorMessage(error, "토스 결제 확정에 실패했습니다."),
    };
  }
}

export async function lookupGuestGeneralItemOrder(
  orderNumber: string,
  guestOrderToken: string,
): Promise<ActionResult<UserOrderResponse>> {
  try {
    const parsed = guestLookupSchema.safeParse({ orderNumber, guestOrderToken });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const response = await getApiOrdersGuest(parsed.data);
    return { success: true, data: response.data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: guideErrorMessage(error, "비회원 주문 조회에 실패했습니다."),
    };
  }
}

export async function cancelGuestGeneralItemOrder(
  orderNumber: string,
  guestOrderToken: string,
  reason?: string,
): Promise<ActionResult<UserOrderResponse>> {
  try {
    const parsed = guestCancelSchema.safeParse({ orderNumber, guestOrderToken, reason });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const response = await patchApiOrdersGuestOrdernumberCancel(parsed.data.orderNumber, {
      guestOrderToken: parsed.data.guestOrderToken,
      reason: normalizeOptionalText(parsed.data.reason),
    });

    revalidatePath("/orders/guest");
    return { success: true, data: response.data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: guideErrorMessage(error, "비회원 주문 취소에 실패했습니다."),
    };
  }
}
