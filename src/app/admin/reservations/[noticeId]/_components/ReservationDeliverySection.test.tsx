import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ReservationDeliverySection from "./ReservationDeliverySection";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../../actions", () => ({
  updateReservationDeliveryAction: vi.fn(),
}));

describe("ReservationDeliverySection", () => {
  it("업장별 입고 배송 정보는 기본 접힘 상태이고 토글로 펼칠 수 있다", async () => {
    const user = userEvent.setup();

    render(
      <ReservationDeliverySection
        noticeId={7}
        deliveries={[
          {
            id: 1,
            businessId: 11,
            businessName: "강남 픽업",
            deliveryMethod: "PARCEL",
            carrierName: "CJ대한통운",
            trackingNumber: "1234567890",
          },
        ]}
        companies={[]}
      />,
    );

    const toggleButton = screen.getByRole("button", {
      name: "업장별 입고 배송 정보 1건 펼치기",
    });

    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("강남 픽업")).not.toBeInTheDocument();

    await user.click(toggleButton);

    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("강남 픽업")).toBeInTheDocument();
  });
});
