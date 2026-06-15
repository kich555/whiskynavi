import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { uploadManualPurchaseImportAction } from "../../actions";
import ManualPurchaseImportContent from "./ManualPurchaseImportContent";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("../../../_components/AdminLayoutClient", () => ({
  useSidebar: () => ({ toggle: vi.fn() }),
}));

vi.mock("../../../_components/AdminHeader", () => ({
  default: ({ title }: { title: string }) => <header>{title}</header>,
}));

vi.mock("../../actions", () => ({
  downloadManualPurchaseImportTemplateAction: vi.fn(),
  uploadManualPurchaseImportAction: vi.fn(),
}));

const mockedUploadManualPurchaseImport = vi.mocked(uploadManualPurchaseImportAction);

describe("ManualPurchaseImportContent", () => {
  it("대량 등록 모드와 사용자/보틀 ID 참고 테이블을 표시한다", () => {
    render(
      <ManualPurchaseImportContent
        searchParams={{}}
        users={[
          {
            id: 12,
            name: "홍길동",
            username: "hong",
            email: "hong@example.com",
            status: "ACTIVE",
          },
        ]}
        bottles={[
          {
            id: 34,
            name: "테스트 보틀",
            brand: "Navi",
            consumerPrice: 120000,
            stockQuantity: 5,
          },
        ]}
      />,
    );

    expect(screen.getByText("수동 구매내역 대량 등록")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /한 사용자 여러 보틀/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /한 보틀 여러 사용자/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /여러 사용자 여러 보틀/ })).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument();
    expect(screen.getByText("테스트 보틀")).toBeInTheDocument();
    expect(screen.getByText("120,000원")).toBeInTheDocument();
  });

  it("파일을 선택하지 않고 검증하면 클라이언트 오류를 표시한다", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<ManualPurchaseImportContent searchParams={{}} users={[]} bottles={[]} />);

    await user.click(screen.getByRole("button", { name: "검증" }));

    expect(toast.error).toHaveBeenCalledWith("Excel 파일을 선택해주세요.");
  });

  it("업로드 결과에 실패 행이 있으면 성공 대신 경고를 표시한다", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    mockedUploadManualPurchaseImport.mockResolvedValue({
      success: true,
      data: {
        mode: "MANY_USERS_MANY_BOTTLES",
        dryRun: false,
        totalRows: 3,
        successCount: 2,
        failureCount: 1,
        results: [
          { rowNumber: 2, userId: 1, bottleId: 10, success: true, message: "등록 완료" },
          { rowNumber: 3, userId: 2, bottleId: 11, success: true, message: "등록 완료" },
          { rowNumber: 4, userId: 3, bottleId: 12, success: false, message: "사용자를 찾을 수 없습니다." },
        ],
      },
    });
    const { container } = render(<ManualPurchaseImportContent searchParams={{}} users={[]} bottles={[]} />);
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("file input not found");
    }

    await user.upload(
      input,
      new File(["content"], "manual-purchases.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
    await user.click(screen.getByRole("button", { name: "실제 등록" }));

    expect(toast.warning).toHaveBeenCalledWith("실패 행: 4행 (사용자ID 3, 보틀ID 12): 사용자를 찾을 수 없습니다.");
    expect(toast.success).not.toHaveBeenCalledWith("구매내역 등록을 완료했습니다.");
    expect(screen.getByText("실패 행 상세")).toBeInTheDocument();
    expect(screen.getByText("4행 (사용자ID 3, 보틀ID 12): 사용자를 찾을 수 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("사용자를 찾을 수 없습니다.")).toBeInTheDocument();
  });
});
