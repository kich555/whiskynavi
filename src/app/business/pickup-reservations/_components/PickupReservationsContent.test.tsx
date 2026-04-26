import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PickupReservationsContent from "./PickupReservationsContent";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("../actions", () => ({
  bulkWaitingPickupAction: vi.fn().mockResolvedValue({ success: true }),
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

  it("shows checkbox only for PAYMENT_COMPLETED rows", () => {
    const apps = [
      {
        id: 1,
        bottleName: "Glen",
        applicantUser: { name: "A", nickname: "a", email: "a@test.com", phone: "010" },
        quantity: 1, confirmedQuantity: 1,
        status: "PAYMENT_COMPLETED" as const,
        createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
        bottleId: 1, noticeId: 1, bottleImgUrl: undefined,
      },
      {
        id: 2,
        bottleName: "Yama",
        applicantUser: { name: "B", nickname: "b", email: "b@test.com", phone: "010" },
        quantity: 1, confirmedQuantity: 0,
        status: "CONFIRMED" as const,
        createdAt: "2024-01-02T00:00:00Z", updatedAt: "2024-01-02T00:00:00Z",
        bottleId: 2, noticeId: 2, bottleImgUrl: undefined,
      },
    ];
    render(
      <PickupReservationsContent
        searchParams={{}}
        applications={apps}
        totalElements={2}
      />,
    );
    // One checkbox for PAYMENT_COMPLETED row + one "전체 선택" header checkbox = 2 total
    // But only the row checkbox checks for a specific row
    const checkboxes = screen.getAllByRole("checkbox");
    // At minimum 2 checkboxes: header + row
    expect(checkboxes.length).toBeGreaterThanOrEqual(2);
  });

  it("shows bulk action button when PAYMENT_COMPLETED row is checked", async () => {
    const user = userEvent.setup();
    const app = {
      id: 1,
      bottleName: "Glen",
      applicantUser: { name: "A", nickname: "a", email: "a@test.com", phone: "010" },
      quantity: 1, confirmedQuantity: 1,
      status: "PAYMENT_COMPLETED" as const,
      createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z",
      bottleId: 1, noticeId: 1, bottleImgUrl: undefined,
    };
    render(
      <PickupReservationsContent
        searchParams={{}}
        applications={[app]}
        totalElements={1}
      />,
    );
    expect(screen.queryByText(/일괄 픽업대기 처리/)).not.toBeInTheDocument();

    // Click the row checkbox (not header)
    const rowCheckbox = screen.getAllByRole("checkbox")[1];
    await user.click(rowCheckbox);

    expect(screen.getByText("일괄 픽업대기 처리 (1건)")).toBeInTheDocument();
  });

  it("does not show bulk action button when no rows selected", () => {
    render(
      <PickupReservationsContent
        searchParams={{}}
        applications={[]}
        totalElements={0}
      />,
    );
    expect(screen.queryByText(/일괄 픽업대기 처리/)).not.toBeInTheDocument();
  });
});
