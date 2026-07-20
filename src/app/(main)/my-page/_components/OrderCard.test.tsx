import type { UserOrderResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OrderCard from "./OrderCard";

describe("OrderCard", () => {
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
});
