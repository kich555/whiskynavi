import type { AdminBottleReservationNoticeResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateNoticeAvailableQuantityAction } from "../../actions";
import NoticeInfoSection from "./NoticeInfoSection";

vi.mock("../../actions", () => ({
  updateNoticeAvailableQuantityAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const mockedUpdateNoticeAvailableQuantity = vi.mocked(updateNoticeAvailableQuantityAction);

function notice(): AdminBottleReservationNoticeResponse {
  return {
    id: 100,
    bottleId: 11,
    bottleName: "테스트 보틀",
    bottleBrand: "테스트",
    saleStatus: "OPEN",
    editable: true,
    price: 120000,
    reservationStartAt: "2026-06-08T10:00:00.000Z",
    reservationEndAt: "2026-06-08T12:00:00.000Z",
    availableQuantity: 5,
    approvedQuantity: 2,
    maxOrderQuantity: 2,
    description: "설명",
    gradeConditions: [
      {
        applicableFrom: "2026-06-08T10:00:00.000Z",
        requiredRole: "ROLE_USER",
      },
    ],
  };
}

describe("NoticeInfoSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("공고정보에서 수락 수량을 명시적으로 보여주고 남은 수락 수량을 수정한다", async () => {
    const user = userEvent.setup();
    mockedUpdateNoticeAvailableQuantity.mockResolvedValue({ success: true });
    render(<NoticeInfoSection notice={notice()} />);

    expect(screen.getByText("총 수락 가능 수량")).toBeInTheDocument();
    expect(screen.getByText("7병")).toBeInTheDocument();
    expect(screen.getByText("현재 수락한 수량")).toBeInTheDocument();
    expect(screen.getByText("2병")).toBeInTheDocument();
    expect(screen.getByText("남은 수락 수량")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "남은 수락 수량 수정" }));
    const input = screen.getByLabelText("남은 수락 수량");
    await user.clear(input);
    await user.type(input, "7");
    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(mockedUpdateNoticeAvailableQuantity).toHaveBeenCalledWith(
      expect.objectContaining({
        noticeId: 100,
        bottleId: 11,
        availableQuantity: 7,
      }),
    );
  });
});
