import type { UserOrderResponse } from "@/apis/generated/api";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { lookupGuestGeneralItemOrder } from "../../general-items/delivery-order/actions";
import GuestOrderLookupClient from "./GuestOrderLookupClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("../../general-items/delivery-order/actions", () => ({
  cancelGuestGeneralItemOrder: vi.fn(),
  lookupGuestGeneralItemOrder: vi.fn(),
}));

describe("GuestOrderLookupClient", () => {
  it("비회원 주문 상세에 주문 분류를 표시하고 계좌이체 안내는 표시하지 않는다", async () => {
    vi.mocked(lookupGuestGeneralItemOrder).mockResolvedValue({
      success: true,
      data: {
        id: 1,
        orderNumber: "ODR-GUEST-1",
        orderStatus: "ORDER_PREPARING",
        itemName: "테이스팅 글라스",
        requestedQuantity: 1,
        totalPrice: 10000,
        productType: "ITEM",
        fulfillmentMethod: "DIRECT_DELIVERY",
        saleTiming: "IMMEDIATE",
        payment: {
          paymentMethod: "TOSS",
          paymentStatus: "DONE",
          bankTransferGuideMessage: "계좌이체 안내",
        },
      } satisfies UserOrderResponse,
    });

    render(<GuestOrderLookupClient initialOrderNumber="ODR-GUEST-1" initialGuestOrderToken="TOKEN-1" />);

    await waitFor(() => expect(screen.getByText("ODR-GUEST-1")).toBeInTheDocument());
    expect(screen.getByText("아이템 · 직배송 · 바로배송")).toBeInTheDocument();
    expect(screen.queryByText("계좌이체 안내")).not.toBeInTheDocument();
  });
});
