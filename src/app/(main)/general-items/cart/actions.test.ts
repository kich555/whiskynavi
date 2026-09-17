import { ApiError } from "@/apis/errors";
import { addItem, deleteItem, getCurrent, getOrCreate, quote, updateQuantity } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CART_COMPLETED_COOKIE, CART_TOKEN_COOKIE } from "./_lib/cart-token";
import {
  addGeneralItemToCart,
  fetchCartQuote,
  fetchCurrentCart,
  removeCartItem,
  updateCartItemQuantity,
} from "./actions";

vi.mock("@/apis/generated/api", () => ({
  addItem: vi.fn(),
  deleteItem: vi.fn(),
  getCurrent: vi.fn(),
  getOrCreate: vi.fn(),
  quote: vi.fn(),
  updateQuantity: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getAuthToken: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

const mockedAddItem = vi.mocked(addItem);
const mockedDeleteItem = vi.mocked(deleteItem);
const mockedGetCurrent = vi.mocked(getCurrent);
const mockedGetOrCreate = vi.mocked(getOrCreate);
const mockedQuote = vi.mocked(quote);
const mockedUpdateQuantity = vi.mocked(updateQuantity);
const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedCookies = vi.mocked(cookies);
const mockedRevalidatePath = vi.mocked(revalidatePath);

function createCookieStore(cartToken?: string) {
  return {
    get: vi.fn((name: string) => (name === CART_TOKEN_COOKIE && cartToken ? { name, value: cartToken } : undefined)),
    set: vi.fn(),
    delete: vi.fn(),
  };
}

function createCompletedCookieStore() {
  return {
    get: vi.fn((name: string) => (name === CART_COMPLETED_COOKIE ? { name, value: "1" } : undefined)),
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

describe("general item cart actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue(undefined);
    mockedCookies.mockResolvedValue(mockCookieStore("cart-token"));
  });

  it("invalid add input does not call API and returns sale announcement validation error", async () => {
    const result = await addGeneralItemToCart({
      saleAnnouncementId: 0,
      quantity: 1,
    });

    expect(result).toEqual({
      success: false,
      error: "판매 공고 정보가 올바르지 않습니다.",
    });
    expect(mockedAddItem).not.toHaveBeenCalled();
  });

  it("adds item with optional auth and cart token headers, stores returned cart token, and revalidates cart path", async () => {
    const cookieStore = createCookieStore("cart-token");
    mockedCookies.mockResolvedValue(cookieStore as unknown as Awaited<ReturnType<typeof cookies>>);
    mockedGetAuthToken.mockResolvedValue("access-token");
    mockedAddItem.mockResolvedValue({
      data: { cartToken: "new-cart-token" },
      status: 200,
      headers: new Headers(),
    });

    const result = await addGeneralItemToCart({
      saleAnnouncementId: 100,
      quantity: 2,
    });

    expect(result).toEqual({
      success: true,
      data: { cartToken: "new-cart-token" },
    });
    expect(mockedAddItem).toHaveBeenCalledWith(
      { saleAnnouncementId: 100, quantity: 2 },
      {
        headers: {
          Authorization: "Bearer access-token",
          "X-Cart-Token": "cart-token",
        },
      },
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      CART_TOKEN_COOKIE,
      "new-cart-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }),
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/general-items/cart");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/general-items/cart/order");
  });

  it("clears a stale cart token and retries adding an item when the backend cannot find the cart", async () => {
    const cookieStore = createCookieStore("stale-cart-token");
    mockedCookies.mockResolvedValue(cookieStore as unknown as Awaited<ReturnType<typeof cookies>>);
    mockedAddItem
      .mockRejectedValueOnce(new ApiError(400, '{"error":"장바구니를 찾을 수 없습니다."}'))
      .mockResolvedValueOnce({
        data: { cartToken: "new-cart-token" },
        status: 200,
        headers: new Headers(),
      });

    const result = await addGeneralItemToCart({
      saleAnnouncementId: 100,
      quantity: 2,
    });

    expect(result).toEqual({
      success: true,
      data: { cartToken: "new-cart-token" },
    });
    expect(mockedAddItem).toHaveBeenNthCalledWith(
      1,
      { saleAnnouncementId: 100, quantity: 2 },
      {
        headers: {
          "X-Cart-Token": "stale-cart-token",
        },
      },
    );
    expect(mockedAddItem).toHaveBeenNthCalledWith(2, { saleAnnouncementId: 100, quantity: 2 }, undefined);
    expect(cookieStore.delete).toHaveBeenCalledWith({ name: CART_TOKEN_COOKIE, path: "/" });
    expect(cookieStore.set).toHaveBeenCalledWith(
      CART_TOKEN_COOKIE,
      "new-cart-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }),
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/general-items/cart");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/general-items/cart/order");
  });

  it("updates item quantity with cart item id and quantity body", async () => {
    mockedGetAuthToken.mockResolvedValue("access-token");
    mockedUpdateQuantity.mockResolvedValue({
      data: { cartToken: "updated-token" },
      status: 200,
      headers: new Headers(),
    });

    const result = await updateCartItemQuantity(10, 3);

    expect(result).toEqual({
      success: true,
      data: { cartToken: "updated-token" },
    });
    expect(mockedUpdateQuantity).toHaveBeenCalledWith(
      10,
      { quantity: 3 },
      {
        headers: {
          Authorization: "Bearer access-token",
          "X-Cart-Token": "cart-token",
        },
      },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/general-items/cart");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/general-items/cart/order");
  });

  it("removes item and revalidates cart paths", async () => {
    mockedGetAuthToken.mockResolvedValue("access-token");
    mockedDeleteItem.mockResolvedValue({
      data: { cartToken: "remaining-token" },
      status: 200,
      headers: new Headers(),
    });

    const result = await removeCartItem(10);

    expect(result).toEqual({
      success: true,
      data: { cartToken: "remaining-token" },
    });
    expect(mockedDeleteItem).toHaveBeenCalledWith(10, {
      headers: {
        Authorization: "Bearer access-token",
        "X-Cart-Token": "cart-token",
      },
    });
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/general-items/cart");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/general-items/cart/order");
  });

  it("fetches current cart with optional auth and cart token headers, and stores returned cart token", async () => {
    const cookieStore = createCookieStore("cart-token");
    mockedCookies.mockResolvedValue(cookieStore as unknown as Awaited<ReturnType<typeof cookies>>);
    mockedGetAuthToken.mockResolvedValue("access-token");
    mockedGetCurrent.mockResolvedValue({
      data: { cartToken: "current-cart-token" },
      status: 200,
      headers: new Headers(),
    });

    const result = await fetchCurrentCart();

    expect(result).toEqual({
      success: true,
      data: { cartToken: "current-cart-token" },
    });
    expect(mockedGetCurrent).toHaveBeenCalledWith({
      headers: {
        Authorization: "Bearer access-token",
        "X-Cart-Token": "cart-token",
      },
    });
    expect(cookieStore.set).toHaveBeenCalledWith(
      CART_TOKEN_COOKIE,
      "current-cart-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }),
    );
  });

  it("fetches cart quote with cart token header", async () => {
    mockedQuote.mockResolvedValue({
      data: { itemsTotalPrice: 10000, shippingFee: 3000, totalPrice: 13000 },
      status: 200,
      headers: new Headers(),
    });

    const result = await fetchCartQuote();

    expect(result).toEqual({
      success: true,
      data: { itemsTotalPrice: 10000, shippingFee: 3000, totalPrice: 13000 },
    });
    expect(mockedQuote).toHaveBeenCalledWith({
      headers: {
        "X-Cart-Token": "cart-token",
      },
    });
    expect(mockedGetCurrent).not.toHaveBeenCalled();
  });

  it("returns an empty quote without API call when no auth or cart token exists", async () => {
    mockedCookies.mockResolvedValue(mockCookieStore());

    const result = await fetchCartQuote();

    expect(result).toEqual({
      success: true,
      data: { items: [], itemsTotalPrice: 0, shippingFee: 0, totalPrice: 0 },
    });
    expect(mockedQuote).not.toHaveBeenCalled();
  });

  it("loads the server cart even when a legacy checkout completion cookie exists", async () => {
    mockedGetAuthToken.mockResolvedValue("access-token");
    mockedCookies.mockResolvedValue(createCompletedCookieStore() as unknown as Awaited<ReturnType<typeof cookies>>);
    mockedGetOrCreate.mockResolvedValue({ data: { items: [] }, status: 200, headers: new Headers() });
    mockedQuote.mockResolvedValue({
      data: { items: [], itemsTotalPrice: 0, shippingFee: 0, totalPrice: 0 },
      status: 200,
      headers: new Headers(),
    });

    const result = await fetchCartQuote();

    expect(result).toEqual({
      success: true,
      data: { items: [], itemsTotalPrice: 0, shippingFee: 0, totalPrice: 0 },
    });
    expect(mockedGetOrCreate).toHaveBeenCalled();
    expect(mockedQuote).toHaveBeenCalled();
  });

  it("returns an empty current cart without API call when no auth or cart token exists", async () => {
    mockedCookies.mockResolvedValue(mockCookieStore());

    const result = await fetchCurrentCart();

    expect(result).toEqual({
      success: true,
      data: { items: [] },
    });
    expect(mockedGetCurrent).not.toHaveBeenCalled();
  });

  it("returns an empty quote when an authenticated user has no created cart yet", async () => {
    mockedGetAuthToken.mockResolvedValue("access-token");
    mockedCookies.mockResolvedValue(mockCookieStore());
    mockedGetOrCreate.mockResolvedValue({
      data: { items: [] },
      status: 200,
      headers: new Headers(),
    });
    mockedQuote.mockRejectedValue(new ApiError(400, '{"error":"장바구니를 찾을 수 없습니다."}'));

    const result = await fetchCartQuote();

    expect(result).toEqual({
      success: true,
      data: { items: [], itemsTotalPrice: 0, shippingFee: 0, totalPrice: 0 },
    });
  });

  it("returns an empty current cart when an authenticated user has no created cart yet", async () => {
    mockedGetAuthToken.mockResolvedValue("access-token");
    mockedCookies.mockResolvedValue(mockCookieStore());
    mockedGetOrCreate.mockResolvedValue({
      data: { items: [] },
      status: 200,
      headers: new Headers(),
    });
    mockedGetCurrent.mockRejectedValue(new ApiError(400, '{"error":"장바구니를 찾을 수 없습니다."}'));

    const result = await fetchCurrentCart();

    expect(result).toEqual({
      success: true,
      data: { items: [] },
    });
  });

  it("creates or restores an authenticated cart before reading quote when no cart token exists", async () => {
    mockedGetAuthToken.mockResolvedValue("access-token");
    mockedCookies.mockResolvedValue(mockCookieStore());
    mockedGetOrCreate.mockResolvedValue({
      data: { cartToken: "created-token", items: [] },
      status: 200,
      headers: new Headers(),
    });
    mockedQuote.mockResolvedValue({
      data: { items: [], itemsTotalPrice: 0, shippingFee: 0, totalPrice: 0 },
      status: 200,
      headers: new Headers(),
    });

    await fetchCartQuote();

    expect(mockedGetOrCreate).toHaveBeenCalledWith({
      headers: {
        Authorization: "Bearer access-token",
      },
    });
    expect(mockedQuote).toHaveBeenCalledWith({
      headers: {
        Authorization: "Bearer access-token",
      },
    });
  });

  it("normalizes an empty quote to zero totals even if backend returns a shipping fee", async () => {
    mockedQuote.mockResolvedValue({
      data: { items: [], itemsTotalPrice: 0, shippingFee: 3000, totalPrice: 3000 },
      status: 200,
      headers: new Headers(),
    });

    const result = await fetchCartQuote();

    expect(result).toEqual({
      success: true,
      data: { items: [], itemsTotalPrice: 0, shippingFee: 0, totalPrice: 0 },
    });
  });

  it("returns read action user message when API rejects", async () => {
    mockedQuote.mockRejectedValue(new ApiError(400, '{"message":"장바구니가 비어 있습니다."}'));

    await expect(fetchCartQuote()).resolves.toEqual({
      success: false,
      error: "장바구니가 비어 있습니다.",
    });
  });

  it("rethrows redirect errors from mutations", async () => {
    const redirectError = createRedirectError();
    mockedAddItem.mockRejectedValue(redirectError);

    await expect(
      addGeneralItemToCart({
        saleAnnouncementId: 100,
        quantity: 1,
      }),
    ).rejects.toBe(redirectError);
  });
});
