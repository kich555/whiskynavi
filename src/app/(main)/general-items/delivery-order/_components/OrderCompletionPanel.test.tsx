import type { UserGeneralItemDeliveryOrderResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OrderCompletionPanel from "./OrderCompletionPanel";

describe("OrderCompletionPanel", () => {
  it("주문 완료 정보를 표시한다", () => {
    const result = {
      order: {
        orderNumber: "ODR-COMPLETE-1",
        orderStatus: "ORDER_PREPARING",
        payment: {
          paymentMethod: "TOSS",
          paymentStatus: "DONE",
          paidAmount: 10000,
        },
      },
    } satisfies UserGeneralItemDeliveryOrderResponse;

    render(<OrderCompletionPanel result={result} />);

    expect(screen.getByText("주문 접수가 완료되었습니다.")).toBeInTheDocument();
    expect(screen.getByText("ODR-COMPLETE-1")).toBeInTheDocument();
    expect(screen.getByText("10,000원")).toBeInTheDocument();
  });
});
