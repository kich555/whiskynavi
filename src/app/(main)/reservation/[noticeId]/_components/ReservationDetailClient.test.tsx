import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  PickupLocationResponse,
  UserBottleReservationApplicationPublicResponse,
  UserBottleReservationNoticePublicResponse,
} from "@/apis/generated/api";
import ReservationDetailClient from "./ReservationDetailClient";

vi.mock("@/components/ui/ImageWithFallback", () => ({
  ImageWithFallback: ({ alt }: { alt: string }) => <span aria-label={alt} role="img" />,
}));

vi.mock("../../actions", () => ({
  applyReservation: vi.fn(),
  cancelReservation: vi.fn(),
  updateReservation: vi.fn(),
}));

vi.mock("../../_lib/useServerClock", () => ({
  useServerClock: () => ({
    getNow: () => new Date("2026-07-07T12:00:00.000Z").getTime(),
    isSynced: true,
  }),
}));

describe("ReservationDetailClient", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("예약 종료 이후에는 신청 완료 건의 수정과 취소 버튼을 표시하지 않는다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-07T12:00:00.000Z"));

    render(
      <ReservationDetailClient
        notice={notice({
          reservationStartAt: "2026-07-07T10:00:00.000Z",
          reservationEndAt: "2026-07-07T12:00:00.000Z",
        })}
        pickupLocations={[pickupLocation()]}
        myApplication={application()}
      />,
    );

    expect(screen.getAllByText("예약 종료됨").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "예약신청완료" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "수정하기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "취소하기" })).not.toBeInTheDocument();
  });
});

function notice(
  overrides: Partial<UserBottleReservationNoticePublicResponse> = {},
): UserBottleReservationNoticePublicResponse {
  return {
    id: 1,
    noticeName: "테스트 공고명",
    bottleName: "테스트 보틀",
    bottleBrand: "테스트 브랜드",
    bottleImgUrl: "",
    maxOrderQuantity: 2,
    reservationStartAt: "2026-07-07T10:00:00.000Z",
    reservationEndAt: "2026-07-07T12:00:00.000Z",
    ...overrides,
  };
}

function pickupLocation(): PickupLocationResponse {
  return {
    id: 10,
    businessName: "테스트 업장",
  };
}

function application(): UserBottleReservationApplicationPublicResponse {
  return {
    id: 100,
    quantity: 1,
    pickupUserBusinessId: 10,
    pickupBusinessName: "테스트 업장",
    status: "APPLIED",
  };
}
