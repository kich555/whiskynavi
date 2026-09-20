"use server";

import { ApiError, getUserErrorMessage } from "@/apis/errors";
import {
  postApiOrdersGeneralItemsDeliveryCartTossConfirm,
  postApiOrdersGeneralItemsDeliveryCartTossTickets,
  type GeneralItemDeliveryTicketResponse,
  type PostApiOrdersGeneralItemsDeliveryCartTossTicketsBody,
  type UserGeneralItemDeliveryOrderResponse,
} from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cookies } from "next/headers";
import { z } from "zod";
import { buildCartHeaders, CART_COMPLETED_COOKIE, CART_TOKEN_COOKIE } from "../_lib/cart-token";

const CART_PATH = "/general-items/cart";
const CART_ORDER_PATH = "/general-items/cart/order";

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  retryWithNewKey?: boolean;
};

type CartOrderBody = PostApiOrdersGeneralItemsDeliveryCartTossTicketsBody;

export type GeneralItemCartDeliveryOrderInput = {
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  deliveryMemo?: string;
  orderNote?: string;
  guestEmail: string;
};

const orderInputSchema = z.object({
  receiverName: z.string().trim().min(1, "수령인 이름을 입력해주세요.").max(100),
  receiverPhone: z.string().trim().min(1, "수령인 연락처를 입력해주세요.").max(20),
  deliveryAddress: z.string().trim().max(500),
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

function normalizeOptionalText(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeOrderInput(input: GeneralItemCartDeliveryOrderInput): CartOrderBody {
  return {
    receiverName: input.receiverName.trim(),
    receiverPhone: input.receiverPhone.trim(),
    deliveryAddress: input.deliveryAddress.trim(),
    deliveryMemo: normalizeOptionalText(input.deliveryMemo),
    orderNote: normalizeOptionalText(input.orderNote),
    guestEmail: input.guestEmail.trim(),
  };
}

async function buildOptions(idempotencyKey?: string): Promise<RequestInit | undefined> {
  const [authToken, cookieStore] = await Promise.all([getAuthToken(), cookies()]);
  const cartToken = cookieStore.get(CART_TOKEN_COOKIE)?.value;
  const headers = buildCartHeaders({ authToken, cartToken, idempotencyKey });

  return Object.keys(headers).length > 0 ? { headers } : undefined;
}

function revalidateCartPaths() {
  revalidatePath(CART_PATH);
  revalidatePath(CART_ORDER_PATH);
}

function revalidateCartPathsSafely() {
  try {
    revalidateCartPaths();
  } catch {
    // 주문/티켓 생성 성공 응답을 캐시 정리 실패로 덮지 않는다.
  }
}

async function finalizeSuccessfulCartOrder() {
  try {
    // 서버가 구매한 행만 정리하므로 비회원 토큰을 유지해 새로 담은 상품에 접근한다.
    const cookieStore = await cookies();
    cookieStore.delete({ name: CART_COMPLETED_COOKIE, path: "/" });
  } catch {
    // 주문 성공 이후의 쿠키 정리 실패가 중복 주문 유도로 이어지지 않게 성공 응답을 보존한다.
  }

  revalidateCartPathsSafely();
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
    return "남은 수량이 부족합니다. 장바구니 수량을 다시 확인해 주세요.";
  }

  return message;
}

export async function createGeneralItemCartTossTicket(
  input: GeneralItemCartDeliveryOrderInput,
  idempotencyKey: string,
): Promise<ActionResult<GeneralItemDeliveryTicketResponse>> {
  try {
    const parsed = orderInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const response = await postApiOrdersGeneralItemsDeliveryCartTossTickets(
      normalizeOrderInput(parsed.data),
      await buildOptions(idempotencyKey),
    );

    revalidateCartPathsSafely();

    return { success: true, data: response.data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: guideErrorMessage(error, "토스 결제 준비에 실패했습니다."),
      ...(error instanceof ApiError &&
      ["주문 티켓이 만료되었습니다.", "이미 종료된 주문 시도입니다."].includes(error.userMessage ?? "")
        ? { retryWithNewKey: true }
        : {}),
    };
  }
}

export async function confirmGeneralItemCartTossPayment(input: {
  orderId?: string;
  paymentKey?: string;
  amount?: string;
}): Promise<ActionResult<UserGeneralItemDeliveryOrderResponse>> {
  try {
    const parsed = tossConfirmSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const response = await postApiOrdersGeneralItemsDeliveryCartTossConfirm(
      {
        pgOrderId: parsed.data.orderId,
        paymentKey: parsed.data.paymentKey,
        amount: parsed.data.amount,
      },
      await buildOptions(),
    );

    await finalizeSuccessfulCartOrder();

    return { success: true, data: response.data };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      error: guideErrorMessage(error, "토스 결제 확정에 실패했습니다."),
    };
  }
}
