import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { overlay } from "overlay-kit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApplicationsTableSection from "./ApplicationsTableSection";

const paginationMock = vi.hoisted(() => vi.fn(() => null));
const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("overlay-kit", () => ({
  overlay: { open: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../../actions", () => ({
  rejectPendingApplicationsAction: vi.fn(),
  uploadReservationAllocationExcelAction: vi.fn(),
}));

vi.mock("../../../_components/Pagination", () => ({
  default: paginationMock,
}));

describe("ApplicationsTableSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("예약신청시각을 밀리초 단위까지 표시한다", () => {
    render(
      <ApplicationsTableSection
        noticeId={7}
        applications={[
          {
            id: 123,
            applicantType: "BUSINESS",
            applicantUser: {
              name: "홍길동",
              phone: "01012345678",
              roles: ["ROLE_USER"],
            },
            pickupBusiness: {
              businessName: "강남 픽업",
            },
            applicantBusiness: {
              businessName: "신청 사업장",
            },
            pickupAssignmentType: "ADMIN_DESIGNATED",
            quantity: 2,
            confirmedQuantity: 1,
            status: "APPLIED",
            createdAt: "2026-06-08T10:12:33.456",
          },
        ]}
        totalElements={1}
        currentPage={1}
        itemsPerPage={20}
        pendingApplicationCount={1}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "예약신청시각" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "신청 사업장" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "비즈니스" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "신청 사업장" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "관리자 지정" })).toBeInTheDocument();
    expect(screen.getByText("2026.06.08 10:12:33.456")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "할당용 Excel 다운로드" })).toHaveAttribute(
      "href",
      "/api/admin/reservations/7/allocation-excel",
    );
    expect(screen.getByLabelText("예약 할당 Excel 파일")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excel 할당 업로드" })).toBeInTheDocument();
  });

  it("페이지 이동 시 선택한 페이지 크기를 유지하도록 limit을 Pagination에 전달한다", () => {
    render(
      <ApplicationsTableSection
        noticeId={7}
        applications={[]}
        totalElements={120}
        currentPage={2}
        itemsPerPage={50}
        pendingApplicationCount={0}
        currentRole="ROLE_USER"
        currentStatus="APPLIED"
      />,
    );

    expect(paginationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        itemsPerPage: 50,
        searchParams: {
          limit: "50",
          role: "ROLE_USER",
          status: "APPLIED",
        },
      }),
      undefined,
    );
  });

  it("확정 상태 신청에는 확정 수량 수정 버튼을 표시한다", () => {
    render(
      <ApplicationsTableSection
        noticeId={7}
        applications={[
          {
            id: 123,
            applicantUser: {
              name: "홍길동",
              phone: "01012345678",
              roles: ["ROLE_USER"],
            },
            pickupBusiness: {
              businessName: "강남 픽업",
            },
            quantity: 3,
            confirmedQuantity: 1,
            status: "CONFIRMED",
            createdAt: "2026-06-08T10:12:33.456",
          },
        ]}
        totalElements={1}
        currentPage={1}
        itemsPerPage={20}
        pendingApplicationCount={0}
      />,
    );

    expect(screen.getByTitle("확정 수량 수정")).toBeInTheDocument();
  });

  it("미처리 신청이 있으면 일괄 거절 버튼으로 확인 모달을 연다", async () => {
    const user = userEvent.setup();
    render(
      <ApplicationsTableSection
        noticeId={7}
        applications={[]}
        totalElements={0}
        currentPage={1}
        itemsPerPage={20}
        pendingApplicationCount={2}
      />,
    );

    await user.click(screen.getByRole("button", { name: "미처리 신청 일괄 거절" }));

    expect(overlay.open).toHaveBeenCalled();
  });

  it("미처리 신청이 없으면 일괄 거절 버튼을 비활성화한다", () => {
    render(
      <ApplicationsTableSection
        noticeId={7}
        applications={[]}
        totalElements={0}
        currentPage={1}
        itemsPerPage={20}
        pendingApplicationCount={0}
      />,
    );

    expect(screen.getByRole("button", { name: "미처리 신청 일괄 거절" })).toBeDisabled();
  });

  it("URL 필터 props가 바뀌면 사업장 ID 입력값도 새 값으로 초기화한다", () => {
    const { rerender } = render(
      <ApplicationsTableSection
        noticeId={7}
        applications={[]}
        totalElements={0}
        currentPage={1}
        itemsPerPage={20}
        pendingApplicationCount={0}
        currentApplicantBusinessId={10}
        currentPickupBusinessId={20}
      />,
    );

    expect(screen.getByLabelText("신청 사업장 ID")).toHaveValue(10);
    expect(screen.getByLabelText("픽업 업장 ID")).toHaveValue(20);

    rerender(
      <ApplicationsTableSection
        noticeId={7}
        applications={[]}
        totalElements={0}
        currentPage={1}
        itemsPerPage={20}
        pendingApplicationCount={0}
        currentApplicantBusinessId={30}
        currentPickupBusinessId={40}
      />,
    );

    expect(screen.getByLabelText("신청 사업장 ID")).toHaveValue(30);
    expect(screen.getByLabelText("픽업 업장 ID")).toHaveValue(40);
  });
});
