import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { uploadReservationAllocationExcelAction } from "../../actions";
import ReservationAllocationExcelSection from "./ReservationAllocationExcelSection";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("next/link", () => ({
  default: () => {
    throw new Error("binary download route should use a plain anchor");
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../../actions", () => ({
  uploadReservationAllocationExcelAction: vi.fn(),
}));

const mockedUploadReservationAllocationExcel = vi.mocked(uploadReservationAllocationExcelAction);

describe("ReservationAllocationExcelSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("할당용 Excel 다운로드 링크를 공고별 proxy route로 표시한다", () => {
    render(<ReservationAllocationExcelSection noticeId={42} />);

    const link = screen.getByRole("link", {
      name: "할당용 Excel 다운로드",
    });

    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/api/admin/reservations/42/allocation-excel");
  });

  it("수동 등록 구매내역 포함 옵션을 켜면 다운로드 링크에 옵션을 추가한다", async () => {
    const user = userEvent.setup();
    render(<ReservationAllocationExcelSection noticeId={42} />);

    await user.click(screen.getByRole("switch", { name: "Excel 시리즈 가산점에 관리자 수동 등록 주문 포함" }));

    expect(screen.getByRole("link", { name: "할당용 Excel 다운로드" })).toHaveAttribute(
      "href",
      "/api/admin/reservations/42/allocation-excel?includeAdminManualOrdersInSeriesScore=true",
    );
  });

  it("파일을 선택하지 않고 업로드하면 안내 toast를 표시하고 action을 호출하지 않는다", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<ReservationAllocationExcelSection noticeId={42} />);

    await user.click(screen.getByRole("button", { name: "Excel 할당 업로드" }));

    expect(toast.error).toHaveBeenCalledWith("Excel 파일을 선택해주세요.");
    expect(mockedUploadReservationAllocationExcel).not.toHaveBeenCalled();
  });

  it("업로드 성공 시 총 할당 수량을 표시한다", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    mockedUploadReservationAllocationExcel.mockResolvedValue({
      success: true,
      data: {
        success: true,
        noticeId: 42,
        processedRowCount: 2,
        allocatedApplicationCount: 2,
        rejectedApplicationCount: 1,
        totalAllocatedQuantity: 2,
        remainingQuantityBeforeAllocation: 5,
        remainingQuantityAfterAllocation: 3,
        failures: [],
      },
    });
    render(<ReservationAllocationExcelSection noticeId={42} />);

    const file = new File(["applicationId,allocatedQuantity"], "allocation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await user.upload(screen.getByLabelText("예약 할당 Excel 파일"), file);
    await user.click(screen.getByRole("button", { name: "Excel 할당 업로드" }));

    expect(await screen.findByText("총 할당 수량 2")).toBeInTheDocument();
    expect(screen.getByText("거절 신청 1건")).toBeInTheDocument();
    expect(mockedUploadReservationAllocationExcel).toHaveBeenCalledWith(42, file);
    expect(toast.success).toHaveBeenCalledWith("Excel 할당 업로드를 완료했습니다.");
    expect(refresh).toHaveBeenCalled();
  });

  it("업로드 실패 시 행별 실패 사유와 행/신청 ID를 표시한다", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    mockedUploadReservationAllocationExcel.mockResolvedValue({
      success: false,
      error: "예약 신청 Excel 할당을 처리할 수 없습니다.",
      failures: [
        {
          rowNumber: 3,
          applicationId: 20,
          reason: "할당 수량은 신청 수량을 초과할 수 없습니다.",
        },
        {
          rowNumber: undefined,
          applicationId: null,
          reason: "신청 ID를 찾을 수 없습니다.",
        },
      ],
    });
    render(<ReservationAllocationExcelSection noticeId={42} />);

    const file = new File(["applicationId,allocatedQuantity"], "allocation.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await user.upload(screen.getByLabelText("예약 할당 Excel 파일"), file);
    await user.click(screen.getByRole("button", { name: "Excel 할당 업로드" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("예약 신청 Excel 할당을 처리할 수 없습니다.");
    });
    expect(screen.getByText("할당 수량은 신청 수량을 초과할 수 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("신청 ID를 찾을 수 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getAllByText("-")).toHaveLength(2);
  });
});
