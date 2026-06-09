import type { AdminBottleReservationNoticeResponse } from "@/apis/generated/api";
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
  it("CLOSED 상태 예약 공고는 목록에서 수정 버튼을 표시하지 않는다", () => {
    const closedNotice = {
      id: 7,
      saleStatus: "CLOSED",
      bottleName: "종료 보틀",
      reservationEndAt: new Date(Date.now() + 60_000).toISOString(),
      price: 120000,
    } as AdminBottleReservationNoticeResponse & { saleStatus: "CLOSED" };

    render(<ReservationsContent searchParams={{}} notices={[closedNotice]} totalElements={1} />);

    expect(screen.queryByTitle("수정")).not.toBeInTheDocument();
  });
});
