import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PickupReservationsContent from "./PickupReservationsContent";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const searchParams = {};

describe("PickupReservationsContent", () => {
  it("shows empty state when no applications", () => {
    render(
      <PickupReservationsContent
        searchParams={searchParams}
        applications={[]}
        totalElements={0}
      />,
    );
    expect(
      screen.getByText("픽업 예약 신청이 없습니다."),
    ).toBeInTheDocument();
  });

  it("shows total count", () => {
    render(
      <PickupReservationsContent
        searchParams={searchParams}
        applications={[]}
        totalElements={42}
      />,
    );
    expect(screen.getByText("총 42건")).toBeInTheDocument();
  });

  it("renders application row with bottle name and applicant", () => {
    const mockApp = {
      id: 1,
      bottleName: "Glen 12",
      applicantUser: { name: "김철수", nickname: "glen_lover", email: "kim@test.com", phone: "010-0000-0000" },
      quantity: 2,
      confirmedQuantity: 1,
      status: "APPLIED" as const,
      createdAt: "2024-01-15T00:00:00Z",
      updatedAt: "2024-01-15T00:00:00Z",
      bottleId: 5,
      noticeId: 10,
      bottleImgUrl: undefined,
    };

    render(
      <PickupReservationsContent
        searchParams={searchParams}
        applications={[mockApp]}
        totalElements={1}
      />,
    );

    expect(screen.getByText("Glen 12")).toBeInTheDocument();
    expect(screen.getByText("김철수")).toBeInTheDocument();
    expect(screen.getByText("신청완료")).toBeInTheDocument();
  });

  it("renders status badge with correct label for WAITING_PICKUP", () => {
    const mockApp = {
      id: 2,
      bottleName: "Yamazaki",
      applicantUser: { name: "이영희", nickname: "y", email: "lee@test.com", phone: "010-1111-2222" },
      quantity: 1,
      confirmedQuantity: 1,
      status: "WAITING_PICKUP" as const,
      createdAt: "2024-02-01T00:00:00Z",
      updatedAt: "2024-02-01T00:00:00Z",
      bottleId: 6,
      noticeId: 11,
      bottleImgUrl: undefined,
    };

    render(
      <PickupReservationsContent
        searchParams={searchParams}
        applications={[mockApp]}
        totalElements={1}
      />,
    );

    expect(screen.getByText("픽업대기")).toBeInTheDocument();
  });

  it("renders page title", () => {
    render(
      <PickupReservationsContent
        searchParams={searchParams}
        applications={[]}
        totalElements={0}
      />,
    );
    expect(screen.getByText("픽업 예약 관리")).toBeInTheDocument();
  });
});
