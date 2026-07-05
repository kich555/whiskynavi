import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addToCartFormAction } from "../actions";
import GeneralItemOrderForm from "./GeneralItemOrderForm";

vi.mock("../actions", () => ({
  addToCartFormAction: vi.fn(),
}));

const mockedAddToCartFormAction = vi.mocked(addToCartFormAction);

describe("GeneralItemOrderForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits with correct FormData when ordering now", async () => {
    const user = userEvent.setup();
    mockedAddToCartFormAction.mockResolvedValue({ success: true });

    render(<GeneralItemOrderForm saleAnnouncementId={1001} quantityLimit={5} />);

    await user.click(screen.getByRole("button", { name: "수량 증가" }));
    await user.click(screen.getByRole("button", { name: "바로 주문" }));

    expect(mockedAddToCartFormAction).toHaveBeenCalled();
    const formData: FormData = mockedAddToCartFormAction.mock.calls[0][1];
    expect(formData.get("saleAnnouncementId")).toBe("1001");
    expect(formData.get("quantity")).toBe("2");
    expect(formData.get("intent")).toBe("orderNow");
  });

  it("shows success banner when adding to cart succeeds", async () => {
    const user = userEvent.setup();
    mockedAddToCartFormAction.mockResolvedValue({ success: true });

    render(<GeneralItemOrderForm saleAnnouncementId={1001} quantityLimit={5} />);

    await user.click(screen.getByRole("button", { name: "장바구니 담기" }));

    expect(screen.getByText("장바구니에 상품을 담았습니다.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "장바구니 보기" })).toBeInTheDocument();
  });

  it("shows the action error when adding to cart fails", async () => {
    const user = userEvent.setup();
    mockedAddToCartFormAction.mockResolvedValue({ success: false, error: "재고가 부족합니다." });

    render(<GeneralItemOrderForm saleAnnouncementId={1001} quantityLimit={5} />);

    await user.click(screen.getByRole("button", { name: "장바구니 담기" }));

    expect(screen.getByText("재고가 부족합니다.")).toBeInTheDocument();
  });
});
