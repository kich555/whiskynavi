import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportAdminDeliveryWorkbook, uploadAdminDeliveryWorkbook } from "../actions";
import DeliveryWorkbookPanel from "./DeliveryWorkbookPanel";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../actions", () => ({ exportAdminDeliveryWorkbook: vi.fn(), uploadAdminDeliveryWorkbook: vi.fn() }));

describe("출고 엑셀", () => {
  beforeEach(() => vi.clearAllMocks());

  it("선택한 파일을 검증해야 발송할 수 있고 파일을 바꾸면 검증이 무효화된다", async () => {
    const user = userEvent.setup();
    const first = new File(["xlsx"], "first.xlsx");
    const second = new File(["xlsx"], "second.xlsx");
    vi.mocked(uploadAdminDeliveryWorkbook).mockResolvedValue({
      success: true,
      data: {
        dryRun: true,
        totalRows: 120,
        successCount: 95,
        failureCount: 3,
        skippedCount: 22,
        results: [{ rowNumber: 4, orderNumber: "ORD-1", success: false, message: "취소 요청 주문입니다." }],
      },
    });
    render(<DeliveryWorkbookPanel filters={{}} />);
    expect(screen.getByRole("button", { name: "검증 후 발송 처리" })).toBeDisabled();
    await user.upload(screen.getByLabelText(/작성한 출고 엑셀/), first);
    expect(screen.getByRole("button", { name: "검증 후 발송 처리" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "엑셀 검증" }));
    expect(uploadAdminDeliveryWorkbook).toHaveBeenCalledWith(first, true);
    expect(await screen.findByRole("button", { name: "발송 가능 95건 처리" })).toBeEnabled();
    expect(screen.getByText("건너뜀 22건")).toBeInTheDocument();
    await user.upload(screen.getByLabelText(/작성한 출고 엑셀/), second);
    expect(screen.getByRole("button", { name: "검증 후 발송 처리" })).toBeDisabled();
    expect(screen.queryByText("건너뜀 22건")).not.toBeInTheDocument();
  });

  it("실제 처리 후 같은 검증 결과로 중복 실행할 수 없다", async () => {
    const user = userEvent.setup();
    vi.mocked(uploadAdminDeliveryWorkbook)
      .mockResolvedValueOnce({ success: true, data: { dryRun: true, successCount: 1, totalRows: 1 } })
      .mockResolvedValueOnce({ success: true, data: { dryRun: false, successCount: 1, totalRows: 1 } });
    render(<DeliveryWorkbookPanel filters={{}} />);
    await user.upload(screen.getByLabelText(/작성한 출고 엑셀/), new File(["xlsx"], "first.xlsx"));
    await user.click(screen.getByRole("button", { name: "엑셀 검증" }));
    await user.click(await screen.findByRole("button", { name: "발송 가능 1건 처리" }));
    expect(await screen.findByText("발송 결과")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "검증 후 발송 처리" })).toBeDisabled();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("다운로드에 현재 검색 조건을 전달하고 오류 주문만 골라 볼 수 있다", async () => {
    const user = userEvent.setup();
    vi.mocked(exportAdminDeliveryWorkbook).mockResolvedValue({ success: false, error: "테스트" });
    vi.mocked(uploadAdminDeliveryWorkbook).mockResolvedValue({
      success: true,
      data: {
        dryRun: true,
        results: [
          { rowNumber: 4, orderNumber: "ORD-OK", success: true, message: "검증 성공" },
          { rowNumber: 5, orderNumber: "ORD-ERROR", success: false, message: "주소 변경" },
          { rowNumber: 6, orderNumber: "ORD-SKIP", skipped: true, message: "운송장 미입력" },
        ],
      },
    });
    const filters = { keyword: "글라스", guestOnly: true, orderStatus: "ORDER_PREPARING" as const };
    render(<DeliveryWorkbookPanel filters={filters} />);
    await user.click(screen.getByRole("button", { name: "출고 엑셀 다운로드" }));
    expect(exportAdminDeliveryWorkbook).toHaveBeenCalledWith(filters);
    await user.upload(screen.getByLabelText(/작성한 출고 엑셀/), new File(["xlsx"], "first.xlsx"));
    await user.click(screen.getByRole("button", { name: "엑셀 검증" }));
    await user.click(await screen.findByLabelText("오류 주문만 보기"));
    expect(screen.getByText("ORD-ERROR")).toBeInTheDocument();
    expect(screen.queryByText("ORD-OK")).not.toBeInTheDocument();
    expect(screen.queryByText("ORD-SKIP")).not.toBeInTheDocument();
  });
});
