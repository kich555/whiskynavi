import { ApiError } from "@/apis/errors";
import {
  postApiOrdersGeneralItemsDeliveryCartTossConfirm,
  postApiOrdersGeneralItemsDeliveryCartTossTickets,
} from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CART_COMPLETED_COOKIE, CART_TOKEN_COOKIE } from "../_lib/cart-token";
import { confirmGeneralItemCartTossPayment, createGeneralItemCartTossTicket } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  postApiOrdersGeneralItemsDeliveryCartTossConfirm: vi.fn(),
  postApiOrdersGeneralItemsDeliveryCartTossTickets: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getAuthToken: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

const mockedTossTickets = vi.mocked(postApiOrdersGeneralItemsDeliveryCartTossTickets);
const mockedTossConfirm = vi.mocked(postApiOrdersGeneralItemsDeliveryCartTossConfirm);
const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedCookies = vi.mocked(cookies);
const mockedRevalidatePath = vi.mocked(revalidatePath);

const validCartOrderInput = {
  receiverName: "홍길동",
  receiverPhone: "010-1234-5678",
  deliveryAddress: "서울특별시 중구",
  deliveryMemo: "문 앞",
  orderNote: "선물용",
  guestEmail: "guest@example.com",
};

function createCookieStore(cartToken?: string) {
  return {
    get: vi.fn((name: string) => (name === CART_TOKEN_COOKIE && cartToken ? { name, value: cartToken } : undefined)),
    set: vi.fn(),
    delete: vi.fn(),
  };
}

function mockCookieStore(cartToken?: string): Awaited<ReturnType<typeof cookies>> {
  return createCookieStore(cartToken) as unknown as Awaited<ReturnType<typeof cookies>>;
}

function createRedirectError(): Error & { digest: string } {
  const error = new Error("NEXT_REDIRECT") as Error & { digest: string };
  error.digest = "NEXT_REDIRECT;replace;/sign-in;307;";
  return error;
}

describe("general item cart delivery order actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedGetAuthToken.mockResolvedValue(undefined);
    mockedCookies.mockResolvedValue(mockCookieStore("cart-token"));
  });

  it("validates receiver fields before Toss ticket creation", async () => {
    const result = await createGeneralItemCartTossTicket(
      {
        ...validCartOrderInput,
        receiverName: "",
      },
      "idem-1",
    );

    expect(result).toEqual({
      success: false,
      error: "수령인 이름을 입력해주세요.",
    });
    expect(mockedTossTickets).not.toHaveBeenCalled();
  });

  it("creates a Toss ticket without sale announcement or requested quantity and keeps cart token", async () => {
    const cookieStore = createCookieStore("cart-token");
    mockedCookies.mockResolvedValue(cookieStore as unknown as Awaited<ReturnType<typeof cookies>>);
    mockedTossTickets.mockResolvedValue({
      data: { ticket: { pgOrderId: "PG-1", amount: 99000 } },
      status: 200,
      headers: new Headers(),
    });

    const result = await createGeneralItemCartTossTicket(validCartOrderInput, "idem-2");

    expect(result).toEqual({
      success: true,
      data: { ticket: { pgOrderId: "PG-1", amount: 99000 } },
    });
    expect(mockedTossTickets).toHaveBeenCalledWith(validCartOrderInput, {
      headers: {
        "Idempotency-Key": "idem-2",
        "X-Cart-Token": "cart-token",
      },
    });
    expect(cookieStore.delete).not.toHaveBeenCalled();
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/general-items/cart");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/general-items/cart/order");
  });

  it("confirms Toss cart payment and preserves the guest cart token", async () => {
    const cookieStore = createCookieStore("cart-token");
    mockedCookies.mockResolvedValue(cookieStore as unknown as Awaited<ReturnType<typeof cookies>>);
    mockedTossConfirm.mockResolvedValue({
      data: { order: { id: 11, orderNumber: "ODR-2" }, paidAmount: 99000 },
      status: 200,
      headers: new Headers(),
    });

    const result = await confirmGeneralItemCartTossPayment({
      orderId: "PG-1",
      paymentKey: "payment-key",
      amount: "99000",
    });

    expect(result).toEqual({
      success: true,
      data: { order: { id: 11, orderNumber: "ODR-2" }, paidAmount: 99000 },
    });
    expect(mockedTossConfirm).toHaveBeenCalledWith(
      {
        pgOrderId: "PG-1",
        paymentKey: "payment-key",
        amount: 99000,
      },
      {
        headers: {
          "X-Cart-Token": "cart-token",
        },
      },
    );
    expect(cookieStore.delete).not.toHaveBeenCalledWith({ name: CART_TOKEN_COOKIE, path: "/" });
    expect(cookieStore.delete).toHaveBeenCalledWith({ name: CART_COMPLETED_COOKIE, path: "/" });
    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/general-items/cart");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/general-items/cart/order");
  });

  it("returns the ticket expired guide message when Toss confirm rejects an expired ticket", async () => {
    mockedTossConfirm.mockRejectedValue(new ApiError(400, '{"message":"주문 티켓이 만료되었습니다."}'));

    const result = await confirmGeneralItemCartTossPayment({
      orderId: "PG-1",
      paymentKey: "payment-key",
      amount: "99000",
    });

    expect(result).toEqual({
      success: false,
      error: "결제 가능 시간이 만료되었습니다. 주문을 다시 시도해 주세요.",
    });
  });

  it("only allows a new attempt after an explicit terminal ticket error", async () => {
    mockedTossTickets.mockRejectedValue(new ApiError(400, '{"message":"주문 티켓이 만료되었습니다."}'));
    expect(await createGeneralItemCartTossTicket(validCartOrderInput, "idem-2")).toMatchObject({
      retryWithNewKey: true,
    });
    mockedTossTickets.mockRejectedValue(new Error("network timeout"));
    expect(await createGeneralItemCartTossTicket(validCartOrderInput, "idem-2")).not.toHaveProperty("retryWithNewKey");
  });

  it("rethrows redirect errors", async () => {
    const redirectError = createRedirectError();
    mockedTossTickets.mockRejectedValue(redirectError);

    await expect(createGeneralItemCartTossTicket(validCartOrderInput, "idem-2")).rejects.toBe(redirectError);
  });
});
