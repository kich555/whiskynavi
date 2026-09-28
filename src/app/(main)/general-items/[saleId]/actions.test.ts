import { getApiSalesSaleid } from "@/apis/generated/api";
import { redirect } from "next/navigation";
import { beforeEach, expect, it, vi } from "vitest";
import { addGeneralItemToCart } from "../cart/actions";
import { addToCartFormAction } from "./actions";
vi.mock("@/apis/generated/api", () => ({ getApiSalesSaleid: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
vi.mock("../cart/actions", () => ({ addGeneralItemToCart: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
function form(intent: string) {
  const f = new FormData();
  f.set("intent", intent);
  f.set("saleAnnouncementId", "12");
  f.set("quantity", "2");
  return f;
}
it("실물 바로 주문은 기존 장바구니를 변경하지 않는다", async () => {
  vi.mocked(getApiSalesSaleid).mockResolvedValue({ data: { serviceProduct: false } } as Awaited<
    ReturnType<typeof getApiSalesSaleid>
  >);
  await expect(addToCartFormAction({ success: false }, form("orderNow"))).rejects.toThrow(
    "REDIRECT:/general-items/delivery-order?saleId=12&quantity=2",
  );
  expect(addGeneralItemToCart).not.toHaveBeenCalled();
});
it("장바구니 담기와 이용권 바로 주문은 기존 흐름을 유지한다", async () => {
  vi.mocked(addGeneralItemToCart).mockResolvedValue({ success: true });
  expect((await addToCartFormAction({ success: false }, form("addToCart"))).success).toBe(true);
  vi.mocked(getApiSalesSaleid).mockResolvedValue({ data: { serviceProduct: true } } as Awaited<
    ReturnType<typeof getApiSalesSaleid>
  >);
  await expect(addToCartFormAction({ success: false }, form("orderNow"))).rejects.toThrow(
    "REDIRECT:/general-items/cart/order",
  );
  expect(addGeneralItemToCart).toHaveBeenCalledTimes(2);
});
it("잘못된 수량이나 조회 실패는 장바구니 변경 없이 오류로 처리한다", async () => {
  const f = form("orderNow");
  f.set("quantity", "-1");
  expect((await addToCartFormAction({ success: false }, f)).success).toBe(false);
  vi.mocked(getApiSalesSaleid).mockRejectedValue(new Error("network"));
  expect((await addToCartFormAction({ success: false }, form("orderNow"))).success).toBe(false);
  expect(addGeneralItemToCart).not.toHaveBeenCalled();
  expect(redirect).not.toHaveBeenCalled();
});
