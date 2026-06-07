import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { removeCartItem, updateCartItemQuantity } from "../actions";
import CartContent from "./CartContent";

const back = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back }),
}));

vi.mock("../actions", () => ({
  removeCartItem: vi.fn(),
  updateCartItemQuantity: vi.fn(),
}));

describe("CartContent", () => {
  beforeEach(() => {
    back.mockReset();
    vi.mocked(removeCartItem).mockReset();
    vi.mocked(updateCartItemQuantity).mockReset();
  });

  it("shows an empty cart message without checkout link", () => {
    render(<CartContent quote={{ items: [] }} />);

    expect(screen.getByText("장바구니에 담긴 상품이 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "주문서로 이동" })).not.toBeInTheDocument();
  });

  it("shows invalid reasons and blocks checkout when every item is invalid", () => {
    render(
      <CartContent
        quote={{
          items: [
            {
              cartItemId: 1,
              itemName: "품절 상품",
              invalidReason: "품절되었습니다.",
              quantity: 1,
              valid: false,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("품절되었습니다.")).toBeInTheDocument();
    expect(screen.getByText("주문 가능한 상품이 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "주문서로 이동" })).not.toBeInTheDocument();
  });

  it("renders quote totals and checkout link for a valid cart", () => {
    render(
      <CartContent
        quote={{
          items: [
            {
              cartItemId: 1,
              itemName: "테스트 상품",
              lineTotalPrice: 20000,
              quantity: 2,
              unitPrice: 10000,
              valid: true,
            },
          ],
          freeShipping: false,
          freeShippingRemainingAmount: 30000,
          itemsTotalPrice: 20000,
          shippingFee: 3000,
          totalPrice: 23000,
        }}
      />,
    );

    expect(screen.getAllByText("20,000원").length).toBeGreaterThan(0);
    expect(screen.getByText("3,000원")).toBeInTheDocument();
    expect(screen.getByText("23,000원")).toBeInTheDocument();
    expect(screen.getByText("30,000원 추가 주문 시 무료배송")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "주문서로 이동" })).toHaveAttribute("href", "/general-items/cart/order");
  });

  it("updates quantity with item-specific controls", async () => {
    vi.mocked(updateCartItemQuantity).mockResolvedValue({ success: true });

    render(
      <CartContent
        quote={{
          items: [
            {
              availableQuantity: 10,
              cartItemId: 1,
              itemName: "테스트 상품",
              lineTotalPrice: 20000,
              maxOrderQuantity: 2,
              quantity: 1,
              valid: true,
            },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "테스트 상품 수량 증가" }));

    await waitFor(() => {
      expect(updateCartItemQuantity).toHaveBeenCalledWith(1, 2);
    });
    expect(screen.getByRole("button", { name: "테스트 상품 수량 감소" })).toBeInTheDocument();
  });

  it("blocks invalid item quantity controls", () => {
    render(
      <CartContent
        quote={{
          items: [
            {
              availableQuantity: 10,
              cartItemId: 1,
              itemName: "주문 불가 상품",
              invalidReason: "품절되었습니다.",
              maxOrderQuantity: 10,
              quantity: 1,
              valid: false,
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "주문 불가 상품 수량 증가" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "주문 불가 상품 수량 감소" })).toBeDisabled();
  });

  it("announces action failures", async () => {
    vi.mocked(removeCartItem).mockRejectedValue(new Error("network"));

    render(
      <CartContent
        quote={{
          items: [
            {
              cartItemId: 1,
              itemName: "테스트 상품",
              quantity: 1,
              valid: true,
            },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "테스트 상품 삭제" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("장바구니 상품을 삭제하지 못했습니다.");
  });

  it("does not show an empty cart state when quote loading fails", () => {
    render(<CartContent error="장바구니 견적을 불러오지 못했습니다." />);

    expect(screen.getByRole("alert")).toHaveTextContent("장바구니 견적을 불러오지 못했습니다.");
    expect(screen.queryByText("장바구니에 담긴 상품이 없습니다.")).not.toBeInTheDocument();
  });
});
