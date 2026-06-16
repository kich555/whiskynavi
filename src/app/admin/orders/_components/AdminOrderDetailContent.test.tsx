import type { AdminOrderResponse as OrderResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminOrderDetailContent from "./AdminOrderDetailContent";

const back = vi.fn();
const toggle = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back }),
}));

vi.mock("@/app/admin/_components/AdminLayoutClient", () => ({
  useSidebar: () => ({ toggle }),
}));

describe("AdminOrderDetailContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders cart order detail with customer, item lines, delivery, and price summary", () => {
    const order = {
      id: 123,
      orderNumber: "ODR-CART-123",
      orderSource: "CART",
      orderStatus: "ORDER_PREPARING",
      createdAt: "2026-05-24T10:00:00+09:00",
      productType: "ITEM",
      fulfillmentMethod: "DIRECT_DELIVERY",
      saleTiming: "IMMEDIATE",
      itemsSummary: "시음권 세트 외 1건",
      itemsCount: 2,
      totalQuantity: 4,
      customer: { name: "김관리", phone: "01012345678", email: "admin@example.com", guest: true },
      guestEmail: "guest@example.com",
      guestPhone: "01087654321",
      delivery: {
        receiverName: "수령인",
        receiverPhone: "01011112222",
        address: "서울시 강남구",
        deliveryMemo: "문 앞",
        carrierName: "CJ대한통운",
        trackingNumber: "1234567890",
      },
      payment: {
        paymentMethod: "TOSS",
        paymentStatus: "DONE",
        paidAmount: 10000,
      },
      items: [
        {
          orderItemId: 1,
          itemName: "시음권 세트",
          quantity: 1,
          unitPrice: 4000,
          lineTotalPrice: 4000,
          productType: "ITEM",
          fulfillmentMethod: "DIRECT_DELIVERY",
          saleTiming: "IMMEDIATE",
        },
        {
          orderItemId: 2,
          itemName: "테이스팅 글라스",
          quantity: 3,
          unitPrice: 1000,
          lineTotalPrice: 3000,
          productType: "ITEM",
          fulfillmentMethod: "DIRECT_DELIVERY",
          saleTiming: "IMMEDIATE",
        },
      ],
      priceSummary: {
        itemsTotalPrice: 7000,
        shippingFee: 3000,
        discountAmount: 0,
        totalPrice: 10000,
        freeShippingApplied: false,
      },
      orderNote: "선물 포장",
      availableAdminActions: ["UPDATE_DELIVERY"],
    } satisfies OrderResponse;

    render(<AdminOrderDetailContent order={order} />);

    expect(screen.getByText("일반상품 주문 상세")).toBeInTheDocument();
    expect(screen.getByText("ODR-CART-123")).toBeInTheDocument();
    expect(screen.getByText("장바구니")).toBeInTheDocument();
    expect(screen.getAllByText("아이템 · 직배송 · 바로배송").length).toBeGreaterThan(0);
    expect(screen.getByText("시음권 세트 외 1건")).toBeInTheDocument();
    expect(screen.getByText("총 수량 4개")).toBeInTheDocument();
    expect(screen.getByText("김관리")).toBeInTheDocument();
    expect(screen.getByText("비회원")).toBeInTheDocument();
    expect(screen.getByText("시음권 세트")).toBeInTheDocument();
    expect(screen.getByText("테이스팅 글라스")).toBeInTheDocument();
    expect(screen.getByText("서울시 강남구")).toBeInTheDocument();
    expect(screen.getByText("상품 합계")).toBeInTheDocument();
    expect(screen.getByText("7,000원")).toBeInTheDocument();
    expect(screen.getByText("배송비")).toBeInTheDocument();
    expect(screen.getAllByText("3,000원")).not.toHaveLength(0);
    expect(screen.getAllByText("10,000원")).not.toHaveLength(0);
    expect(screen.getByText("선물 포장")).toBeInTheDocument();
    expect(screen.getByText("UPDATE_DELIVERY")).toBeInTheDocument();
  });

  it("관리자 수동 구매내역 주문 출처를 표시한다", () => {
    const order = {
      id: 124,
      orderNumber: "ODR-MANUAL-124",
      orderSource: "ADMIN_MANUAL",
      orderStatus: "RECEIPT_COMPLETED",
      itemName: "테스트 보틀",
      requestedQuantity: 1,
      totalPrice: 120000,
      customer: { name: "김관리", guest: false },
      availableAdminActions: [],
    } satisfies OrderResponse;

    render(<AdminOrderDetailContent order={order} />);

    expect(screen.getByText("관리자 수동")).toBeInTheDocument();
  });
});
