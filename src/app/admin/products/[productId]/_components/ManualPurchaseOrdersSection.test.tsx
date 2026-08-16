import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateManualPurchaseStatusesAction } from "../../actions";
import ManualPurchaseOrdersSection from "./ManualPurchaseOrdersSection";

vi.mock("../../actions", () => ({
  updateManualPurchaseStatusesAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockedAction = vi.mocked(updateManualPurchaseStatusesAction);
const mockedUseRouter = vi.mocked(useRouter);
const refresh = vi.fn();

const purchases = [
  {
    id: 101,
    orderNumber: "ORDER-101",
    memberName: "김관리",
    userPhone: "010-1111-2222",
    orderStatus: "RECEIPT_PENDING" as const,
    quantity: 1,
    unitPrice: 120000,
    totalPrice: 120000,
    createdAt: "2026-08-09T10:00:00",
  },
  {
    id: 102,
    orderNumber: "ORDER-102",
    memberName: "이관리",
    userPhone: "010-3333-4444",
    orderStatus: "PAYMENT_COMPLETED" as const,
    quantity: 2,
    unitPrice: 120000,
    totalPrice: 240000,
    createdAt: "2026-08-09T11:00:00",
  },
];

describe("ManualPurchaseOrdersSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
    mockedUseRouter.mockReturnValue({ refresh } as ReturnType<typeof useRouter>);
    mockedAction.mockResolvedValue({ success: true, updatedCount: 2 });
  });

  it("updates every manual purchase for the bottle after selecting only the target status", async () => {
    render(<ManualPurchaseOrdersSection bottleId={10} purchases={purchases} />);

    fireEvent.change(screen.getByRole("combobox", { name: "변경할 주문 상태" }), {
      target: { value: "RECEIPT_COMPLETED" },
    });
    fireEvent.click(screen.getByRole("button", { name: "이 보틀 전체 상태 변경" }));

    await waitFor(() => {
      expect(mockedAction).toHaveBeenCalledWith(10, "RECEIPT_COMPLETED");
    });
    expect(window.confirm).toHaveBeenCalledWith(
      "현재 필터와 페이지에 관계없이 이 보틀의 관리자 수동 등록 주문 전체 상태를 변경합니다. 계속하시겠습니까?",
    );
    expect(toast.success).toHaveBeenCalledWith("2건의 상태를 변경했습니다.");
    expect(refresh).toHaveBeenCalled();
  });

  it("does not update when the bottle-wide confirmation is canceled", () => {
    window.confirm = vi.fn(() => false);
    render(<ManualPurchaseOrdersSection bottleId={10} purchases={purchases} />);

    fireEvent.click(screen.getByRole("button", { name: "이 보틀 전체 상태 변경" }));

    expect(mockedAction).not.toHaveBeenCalled();
  });
});
