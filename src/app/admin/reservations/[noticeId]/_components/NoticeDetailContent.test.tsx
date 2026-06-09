import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NoticeDetailContent from "./NoticeDetailContent";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock("../../../_components/AdminHeader", () => ({
  default: () => null,
}));

vi.mock("../../../_components/AdminLayoutClient", () => ({
  useSidebar: () => ({ toggle: vi.fn() }),
}));

vi.mock("../../_components/ReservationExcelDownloadLink", () => ({
  default: () => null,
}));

vi.mock("./ApplicationsTableSection", () => ({
  default: () => null,
}));

vi.mock("./ApprovalSummarySection", () => ({
  default: () => null,
}));

vi.mock("./NoticeInfoSection", () => ({
  default: () => null,
}));

vi.mock("./ReservationDeliverySection", () => ({
  default: () => null,
}));

describe("NoticeDetailContent", () => {
  it("종료 시각이 지난 예약 공고는 편집 버튼을 표시하지 않는다", () => {
    render(
      <NoticeDetailContent
        notice={{
          id: 7,
          reservationEndAt: new Date(Date.now() - 60_000).toISOString(),
        }}
        applications={[]}
        applicationsTotalElements={0}
        applicationsPage={1}
        applicationsLimit={20}
        deliveries={[]}
        deliveryCompanies={[]}
      />,
    );

    expect(screen.queryByRole("button", { name: "편집" })).not.toBeInTheDocument();
  });
});
