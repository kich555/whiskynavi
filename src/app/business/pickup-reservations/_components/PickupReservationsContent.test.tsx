import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PickupReservationsContent from "./PickupReservationsContent";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("../actions", () => ({
  bulkWaitingPickupAction: vi.fn().mockResolvedValue({ success: true }),
}));

const makeNotice = ({
  noticeId,
  bottleId,
  bottleName,
  totalApplicationCount = 1,
  totalConfirmedQuantity = 1,
  totalRequestedQuantity = 1,
  price = 120000,
}: {
  noticeId: number;
  bottleId: number;
  bottleName: string;
  totalApplicationCount?: number;
  totalConfirmedQuantity?: number;
  totalRequestedQuantity?: number;
  price?: number;
}) => ({
  noticeId,
  bottleId,
  bottleName,
  noticeStatus: "OPEN" as const,
  price,
  totalApplicationCount,
  totalConfirmedQuantity,
  totalRequestedQuantity,
});

describe("PickupReservationsContent", () => {
  it("예약 공고가 없으면 빈 상태를 표시한다", () => {
    render(<PickupReservationsContent searchParams={{}} notices={[]} totalElements={0} />);

    expect(screen.getByText("픽업 예약 공고가 없습니다.")).toBeInTheDocument();
  });

  it("공고 총 개수와 가격 정보를 표시한다", () => {
    render(
      <PickupReservationsContent
        searchParams={{}}
        notices={[makeNotice({ noticeId: 10, bottleId: 5, bottleName: "Glen 12" })]}
        totalElements={42}
      />,
    );

    expect(screen.getByText("공고 42개")).toBeInTheDocument();
    expect(screen.getByText("Glen 12")).toBeInTheDocument();
    expect(screen.getByText("단가 120,000원")).toBeInTheDocument();
  });

  it("신청 목록 버튼을 누르면 공고 상세 페이지로 이동한다", async () => {
    const user = userEvent.setup();

    render(
      <PickupReservationsContent
        searchParams={{}}
        notices={[makeNotice({ noticeId: 10, bottleId: 5, bottleName: "Glen 12" })]}
        totalElements={1}
      />,
    );

    await user.click(screen.getByRole("button", { name: /신청 목록/ }));

    expect(pushMock).toHaveBeenCalledWith("/business/pickup-reservations/notices/10");
  });

  it("공고 일괄 픽업대기 확인 후 화면을 새로고침한다", async () => {
    const user = userEvent.setup();

    render(
      <PickupReservationsContent
        searchParams={{}}
        notices={[makeNotice({ noticeId: 10, bottleId: 5, bottleName: "Glen 12" })]}
        totalElements={1}
      />,
    );

    await user.click(screen.getByRole("button", { name: "공고 일괄 픽업대기" }));
    await user.click(screen.getByRole("button", { name: "픽업대기 확인" }));

    expect(refreshMock).toHaveBeenCalled();
  });

  it("신청 건수가 없는 공고는 일괄 처리 버튼을 비활성화한다", () => {
    render(
      <PickupReservationsContent
        searchParams={{}}
        notices={[
          makeNotice({
            noticeId: 10,
            bottleId: 5,
            bottleName: "Glen 12",
            totalApplicationCount: 0,
          }),
        ]}
        totalElements={1}
      />,
    );

    expect(screen.getByRole("button", { name: "공고 일괄 픽업대기" })).toBeDisabled();
  });
});
