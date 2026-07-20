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

  it("내용이 길어져도 모달을 화면 안에 두고 상세 영역을 스크롤한다", () => {
    const order = {
      id: 2,
      orderNumber: "ODR-MODAL-2",
      orderStatus: "SHIPPING",
      itemName: "테이스팅 글라스 세트",
      requestedQuantity: 2,
      approvedQuantity: 2,
      unitPrice: 10000,
      totalPrice: 20000,
      productType: "ITEM",
      fulfillmentMethod: "DIRECT_DELIVERY",
      saleTiming: "IMMEDIATE",
      payment: {
        paymentMethod: "TOSS",
        paymentStatus: "DONE",
        paidAmount: 20000,
      },
      delivery: {
        receiverName: "나비",
        receiverPhone: "010-1234-5678",
        address: "서울특별시 중구 세종대로 110 상세 주소",
        deliveryMemo: "문 앞에 놓아주세요.",
        carrierName: "CJ대한통운",
        trackingNumber: "1234567890",
      },
    } satisfies UserOrderResponse;

    render(<OrderDetailModal isOpen close={() => {}} order={order} />);

    expect(screen.getByRole("dialog")).toHaveClass("max-h-[calc(100dvh-2rem)]", "overflow-hidden");
    expect(screen.getByTestId("order-detail-scroll-area")).toHaveClass("min-h-0", "overflow-y-auto");
  });
});
