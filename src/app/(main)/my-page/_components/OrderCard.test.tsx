import type { UserOrderResponse } from "@/apis/generated/api";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OrderCard from "./OrderCard";

const { overlayOpenMock } = vi.hoisted(() => ({ overlayOpenMock: vi.fn() }));

vi.mock("overlay-kit", () => ({
  overlay: { open: overlayOpenMock },
}));

describe("OrderCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("보틀 예약 주문은 공고명을 주 제목으로 표시한다", () => {
    render(
      <OrderCard
        order={{
          id: 2,
          saleTiming: "RESERVATION",
          productType: "BOTTLE",
          saleTitle: "7월 커뮤니티 공고",
          itemName: "테스트 보틀",
        }}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText("7월 커뮤니티 공고")).toBeInTheDocument();
    expect(screen.getByText("테스트 보틀")).toBeInTheDocument();
  });

  it("주문 분류를 표시한다", () => {
    render(
      <OrderCard
        order={
          {
            id: 1,
            orderNumber: "ODR-CARD-1",
            orderStatus: "ORDER_PREPARING",
            itemName: "테이스팅 글라스",
            totalPrice: 10000,
            productType: "ITEM",
            fulfillmentMethod: "DIRECT_DELIVERY",
            saleTiming: "IMMEDIATE",
          } satisfies UserOrderResponse
        }
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText("아이템 · 직배송 · 바로배송")).toBeInTheDocument();
  });

  it("수령 대기 주문에만 수령완료 처리 버튼을 표시한다", () => {
    const { rerender } = render(
      <OrderCard
        order={{
          id: 3,
          orderNumber: "ODR-PICKUP-1",
          orderStatus: "RECEIPT_PENDING",
          fulfillmentMethod: "PICKUP",
          itemName: "픽업 보틀",
          totalPrice: 10000,
        }}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "수령완료 처리" })).toBeInTheDocument();

    rerender(
      <OrderCard
        order={{
          id: 3,
          orderNumber: "ODR-PICKUP-1",
          orderStatus: "RECEIPT_COMPLETED",
          fulfillmentMethod: "PICKUP",
          itemName: "픽업 보틀",
          totalPrice: 10000,
        }}
        onClick={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "수령완료 처리" })).not.toBeInTheDocument();
  });

  it("수령완료 처리 버튼 클릭은 주문 상세 열기를 함께 실행하지 않는다", () => {
    const onClick = vi.fn();
    render(
      <OrderCard
        order={{
          id: 3,
          orderNumber: "ODR-PICKUP-1",
          orderStatus: "RECEIPT_PENDING",
          fulfillmentMethod: "PICKUP",
          itemName: "픽업 보틀",
          totalPrice: 10000,
        }}
        onClick={onClick}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "수령완료 처리" }));

    expect(overlayOpenMock).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });

  it.each(["ORDER_PREPARING", "PAYMENT_COMPLETED"] as const)(
    "%s 픽업 주문에도 수령완료 처리 버튼을 표시한다",
    (orderStatus) => {
      render(
        <OrderCard
          order={{
            id: 4,
            orderNumber: "ODR-PICKUP-2",
            orderStatus,
            fulfillmentMethod: "PICKUP",
            itemName: "픽업 보틀",
            totalPrice: 10000,
          }}
          onClick={vi.fn()}
        />,
      );

      expect(screen.getByRole("button", { name: "수령완료 처리" })).toBeInTheDocument();
    },
  );

  it("준비 중인 직배송 주문에는 수령완료 처리 버튼을 표시하지 않는다", () => {
    render(
      <OrderCard
        order={{
          id: 5,
          orderNumber: "ODR-DELIVERY-1",
          orderStatus: "ORDER_PREPARING",
          fulfillmentMethod: "DIRECT_DELIVERY",
          itemName: "배송 상품",
          totalPrice: 10000,
        }}
        onClick={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "수령완료 처리" })).not.toBeInTheDocument();
  });
});
