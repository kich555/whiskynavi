import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { confirmApplicationAction } from "../../actions";
import ApplicationConfirmModal from "./ApplicationConfirmModal";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("../../actions", () => ({
  confirmApplicationAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

const mockedConfirmApplication = vi.mocked(confirmApplicationAction);

describe("ApplicationConfirmModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("신청 수량을 초과하면 재확인 후 승인한다", async () => {
    const user = userEvent.setup();
    mockedConfirmApplication.mockResolvedValue({ success: true });
    render(
      <ApplicationConfirmModal
        isOpen
        close={vi.fn()}
        applicationId={123}
        applicantName="홍길동"
        requestedQuantity={2}
      />,
    );

    const input = screen.getByRole("spinbutton", { name: "확정 수량" });
    await user.clear(input);
    await user.type(input, "3");
    await user.click(screen.getByRole("button", { name: "확정" }));

    expect(input).not.toHaveAttribute("max");
    expect(mockedConfirmApplication).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "초과 수량 승인 재확인" })).toBeInTheDocument();
    expect(screen.getByText("승인 수량: 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "초과 수량 승인" }));

    expect(mockedConfirmApplication).toHaveBeenCalledWith(123, 3);
  });

  it("신청 수량 이하는 재확인 없이 바로 승인한다", async () => {
    const user = userEvent.setup();
    mockedConfirmApplication.mockResolvedValue({ success: true });
    render(
      <ApplicationConfirmModal
        isOpen
        close={vi.fn()}
        applicationId={123}
        applicantName="홍길동"
        requestedQuantity={2}
      />,
    );

    await user.click(screen.getByRole("button", { name: "확정" }));

    expect(mockedConfirmApplication).toHaveBeenCalledWith(123, 2);
    expect(screen.queryByRole("heading", { name: "초과 수량 승인 재확인" })).not.toBeInTheDocument();
  });
});
