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
    expect(screen.getByRole("button", { name: "주문 취소" })).toBeInTheDocument();
  });

  it("예약 주문은 일반 주문 취소 버튼을 표시하지 않는다", () => {
    const order = {
      id: 3,
      orderNumber: "ODR-RESERVATION-1",
      orderStatus: "ORDER_REQUESTED",
      itemName: "예약 보틀",
      requestedQuantity: 1,
      totalPrice: 10000,
      productType: "BOTTLE",
      fulfillmentMethod: "PICKUP",
      saleTiming: "RESERVATION",
    } satisfies UserOrderResponse;

    render(<OrderDetailModal isOpen close={() => {}} order={order} />);

    expect(screen.queryByRole("button", { name: "주문 취소" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "공고 내용 보기" })).toBeInTheDocument();
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

  it("수령 대기 주문에는 수령완료 처리 버튼을 표시한다", () => {
    const order = {
      id: 4,
      orderNumber: "ODR-PICKUP-1",
      orderStatus: "RECEIPT_PENDING",
      fulfillmentMethod: "PICKUP",
      itemName: "픽업 보틀",
      requestedQuantity: 1,
      approvedQuantity: 1,
      totalPrice: 10000,
    } satisfies UserOrderResponse;

    render(<OrderDetailModal isOpen close={() => {}} order={order} />);

    expect(screen.getByRole("button", { name: "수령완료 처리" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "주문 취소" })).not.toBeInTheDocument();
  });

  it("수동입력 주문에는 주문 상태와 배송 진행 단계를 표시하지 않는다", () => {
    const order = {
      id: 5,
      orderNumber: "ODR-MANUAL-1",
      orderSource: "ADMIN_MANUAL",
      itemName: "관리자 입력 보틀",
      requestedQuantity: 1,
      totalPrice: 120000,
      delivery: {
        receiverName: "나비",
        address: "서울특별시 중구",
      },
    } satisfies UserOrderResponse;

    render(<OrderDetailModal isOpen close={() => {}} order={order} />);

    expect(screen.queryByText("알 수 없음")).not.toBeInTheDocument();
    expect(screen.queryByText("배송 진행")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "주문 취소" })).not.toBeInTheDocument();
  });
});
