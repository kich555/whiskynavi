import { beforeEach, describe, expect, it, vi } from "vitest";
import { forgetCheckoutAttempt, getCheckoutAttempt } from "./checkout-attempt";

describe("checkout attempt identity", () => {
  beforeEach(() => sessionStorage.clear());

  it("reuses the key after remount without storing the receiver details", async () => {
    const input = { cartId: 1, receiver: "홍길동", address: "서울시 중구", quantity: 2 };
    const first = await getCheckoutAttempt(input, null);
    const afterReload = await getCheckoutAttempt(input, null);
    expect(afterReload.key).toBe(first.key);
    const stored = Array.from({ length: sessionStorage.length }, (_, index) => {
      const key = sessionStorage.key(index)!;
      return key + sessionStorage.getItem(key);
    }).join("");
    expect(stored).not.toContain("홍길동");
    expect(stored).not.toContain("서울시");
  });

  it("separates different owners, carts, quantities and addresses", async () => {
    const input = { userId: 1, cartId: 1, quantity: 2, address: "서울" };
    const first = await getCheckoutAttempt(input, null);
    for (const change of [{ userId: 2 }, { cartId: 2 }, { quantity: 3 }, { address: "부산" }]) {
      expect((await getCheckoutAttempt({ ...input, ...change }, first)).key).not.toBe(first.key);
    }
    expect((await getCheckoutAttempt(input, null)).key).toBe(first.key);
  });

  it("issues a new key only after the server confirms a terminal attempt", async () => {
    const first = await getCheckoutAttempt({ cartId: 1 }, null);
    forgetCheckoutAttempt(first);
    expect((await getCheckoutAttempt({ cartId: 1 }, null)).key).not.toBe(first.key);
  });

  it("retains the same in-memory key when session storage is blocked", async () => {
    const get = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    try {
      const first = await getCheckoutAttempt({ cartId: 1 }, null);
      expect((await getCheckoutAttempt({ cartId: 1 }, first)).key).toBe(first.key);
    } finally {
      get.mockRestore();
      set.mockRestore();
    }
  });
});
