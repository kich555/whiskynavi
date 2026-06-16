import type { UserOrderResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OrderDetailModal from "./OrderDetailModal";

describe("OrderDetailModal", () => {
  it("주문 분류와 결제 정보를 표시한다", () => {
    const order = {
      id: 1,
      orderNumber: "ODR-MODAL-1",
      orderStatus: "ORDER_PREPARING",
      itemName: "테이스팅 글라스",
      requestedQuantity: 1,
      approvedQuantity: 1,
      unitPrice: 10000,
      totalPrice: 10000,
      productType: "ITEM",
      fulfillmentMethod: "DIRECT_DELIVERY",
      saleTiming: "IMMEDIATE",
      payment: {
        paymentMethod: "TOSS",
        paymentStatus: "DONE",
        paidAmount: 10000,
      },
    } satisfies UserOrderResponse;

    render(<OrderDetailModal isOpen close={() => {}} order={order} />);

    expect(screen.getByText("주문 상품과 결제/배송 정보를 확인합니다.")).toBeInTheDocument();
    expect(screen.getByText("아이템 · 직배송 · 바로배송")).toBeInTheDocument();
    expect(screen.getByText("TOSS")).toBeInTheDocument();
    expect(screen.getAllByText("₩10,000")).not.toHaveLength(0);
  });
});
