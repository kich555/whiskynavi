import type { UserOrderResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OrderDetailClient from "./OrderDetailClient";

vi.mock("overlay-kit", () => ({
  overlay: { open: vi.fn() },
}));

describe("OrderDetailClient", () => {
  it("수동입력 주문에는 상태 영역과 배송 진행 단계를 표시하지 않는다", () => {
    const order = {
      id: 7,
      orderNumber: "ODR-MANUAL-2",
      orderSource: "ADMIN_MANUAL",
      itemName: "관리자 입력 상품",
      requestedQuantity: 1,
      totalPrice: 30000,
      createdAt: "2026-08-23T10:00:00",
      delivery: {
        receiverName: "나비",
        address: "서울특별시 중구",
      },
    } satisfies UserOrderResponse;

    render(<OrderDetailClient order={order} />);

    expect(screen.queryByText("알 수 없음")).not.toBeInTheDocument();
    expect(screen.queryByText("배송 진행")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "주문 취소" })).not.toBeInTheDocument();
    expect(screen.getByText("주문일시")).toBeInTheDocument();
  });
});
