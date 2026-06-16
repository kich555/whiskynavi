import type { UserGeneralItemDeliveryOrderResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OrderCompletionPanel from "./OrderCompletionPanel";

describe("OrderCompletionPanel", () => {
  it("계좌이체 입금 안내를 표시하지 않는다", () => {
    const result = {
      order: {
        orderNumber: "ODR-COMPLETE-1",
        orderStatus: "ORDER_PREPARING",
        payment: {
          paymentMethod: "TOSS",
          paymentStatus: "DONE",
          paidAmount: 10000,
          bankName: "신한은행",
          bankAccountNumber: "123-456",
          bankAccountHolderName: "위스키나비",
          bankTransferGuideMessage: "계좌이체 안내",
          depositDeadlineAt: "2026-06-17T12:00:00+09:00",
        },
      },
      depositDeadlineAt: "2026-06-17T12:00:00+09:00",
    } satisfies UserGeneralItemDeliveryOrderResponse;

    render(<OrderCompletionPanel result={result} />);

    expect(screen.getByText("주문 접수가 완료되었습니다.")).toBeInTheDocument();
    expect(screen.queryByText("입금 안내")).not.toBeInTheDocument();
    expect(screen.queryByText("계좌이체 안내")).not.toBeInTheDocument();
  });
});
