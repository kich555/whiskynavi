import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReservationsContent from "./ReservationsContent";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("../../_components/AdminHeader", () => ({
  default: () => null,
}));

vi.mock("../../_components/AdminLayoutClient", () => ({
  useSidebar: () => ({ toggle: vi.fn() }),
}));

vi.mock("../../_components/Pagination", () => ({
  default: () => null,
}));

vi.mock("./ReservationExcelDownloadLink", () => ({
  default: () => null,
}));

describe("ReservationsContent", () => {
  it("종료 시각이 지난 예약 공고는 목록에서 수정 버튼을 표시하지 않는다", () => {
    render(
      <ReservationsContent
        searchParams={{}}
        notices={[
          {
            id: 7,
            bottleName: "종료 보틀",
            reservationEndAt: new Date(Date.now() - 60_000).toISOString(),
            price: 120000,
          },
        ]}
        totalElements={1}
      />,
    );

    expect(screen.queryByTitle("수정")).not.toBeInTheDocument();
  });
});
