import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeReceipt } from "../actions";
import ReceiptConfirmationModal from "./ReceiptConfirmationModal";

const { refreshMock, toastSuccessMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock("../actions", () => ({
  completeReceipt: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock },
}));

const mockedCompleteReceipt = vi.mocked(completeReceipt);

describe("ReceiptConfirmationModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("되돌릴 수 없음을 경고하고 재확인 후 수령 완료 처리한다", async () => {
    const close = vi.fn();
    const onCompleted = vi.fn();
    mockedCompleteReceipt.mockResolvedValue({ success: true });

    render(
      <ReceiptConfirmationModal isOpen close={close} orderId={17} itemName="테스트 보틀" onCompleted={onCompleted} />,
    );

    expect(screen.getByText("처리 후에는 상태를 되돌릴 수 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("실제로 상품을 수령한 경우에만 진행해 주세요.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "수령완료 확정" }));

    await waitFor(() => expect(mockedCompleteReceipt).toHaveBeenCalledWith(17));
    expect(close).toHaveBeenCalledOnce();
    expect(onCompleted).toHaveBeenCalledOnce();
    expect(refreshMock).toHaveBeenCalledOnce();
    expect(toastSuccessMock).toHaveBeenCalledWith("수령 완료로 처리했습니다.");
  });

  it("처리 실패 시 모달에서 오류를 안내한다", async () => {
    mockedCompleteReceipt.mockResolvedValue({ success: false, error: "수령 대기 상태에서만 가능합니다." });

    render(<ReceiptConfirmationModal isOpen close={vi.fn()} orderId={17} />);
    fireEvent.click(screen.getByRole("button", { name: "수령완료 확정" }));

    expect(await screen.findByText("수령 대기 상태에서만 가능합니다.")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
