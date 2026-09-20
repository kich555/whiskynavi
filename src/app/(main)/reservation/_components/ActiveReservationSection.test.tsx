import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ActiveReservationSection from "./ActiveReservationSection";

vi.mock("@/components/ui/ImageWithFallback", () => ({
  ImageWithFallback: () => null,
}));

describe("ActiveReservationSection", () => {
  afterEach(() => vi.useRealTimers());

  it("목록에서도 회원별 가능 시각을 기준으로 대기와 진행을 구분한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-07T03:00:00Z"));
    const notice = { reservationStartAt: "2026-07-07T10:00:00", reservationEndAt: "2026-07-07T16:00:00" };
    render(
      <ActiveReservationSection
        notices={[
          { ...notice, id: 1, earliestReservableAt: "2026-07-07T13:00:00" },
          { ...notice, id: 2, earliestReservableAt: "2026-07-07T11:00:00" },
        ]}
      />,
    );
    expect(screen.getByText("예약 대기 중")).toBeInTheDocument();
    expect(screen.getByText("진행 중")).toBeInTheDocument();
    expect(screen.queryByText(/예약 가능:/)).not.toBeInTheDocument();
    expect(screen.getAllByText("마감: 2026-07-07 16:00")).toHaveLength(2);
    expect(screen.getByText("현재 진행 중인 예약")).toBeInTheDocument();
  });
});
