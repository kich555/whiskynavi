import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { bulkWaitingPickupAction } from "../actions";
import PickupNoticeApplicationsContent from "./PickupNoticeApplicationsContent";

const backMock = vi.fn();
const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: backMock, push: pushMock, refresh: refreshMock }),
}));

vi.mock("../actions", () => ({
  bulkWaitingPickupAction: vi.fn().mockResolvedValue({ success: true }),
  paymentCompleteAction: vi.fn().mockResolvedValue({ success: true }),
  receiveCompleteAction: vi.fn().mockResolvedValue({ success: true }),
  waitingPickupAction: vi.fn().mockResolvedValue({ success: true }),
}));

describe("PickupNoticeApplicationsContent", () => {
  it("공고 일괄 픽업대기 확인 시 병 ID와 공고 ID를 함께 보낸다", async () => {
    const user = userEvent.setup();
    const mockedBulkWaitingPickupAction = vi.mocked(bulkWaitingPickupAction);

    render(
      <PickupNoticeApplicationsContent
        noticeId={10}
        searchParams={{}}
        applications={[
          {
            id: 100,
            bottleId: 5,
            bottleName: "Glen 12",
            noticeId: 10,
            status: "PAYMENT_COMPLETED",
          },
        ]}
        totalElements={1}
        deliveries={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "공고 일괄 픽업대기" }));
    await user.click(screen.getByRole("button", { name: "픽업대기 확인" }));

    expect(mockedBulkWaitingPickupAction).toHaveBeenCalledWith({
      bottleId: 5,
      noticeId: 10,
    });
    expect(refreshMock).toHaveBeenCalled();
  });
});
