import type {
  PickupLocationResponse,
  UserBottleReservationApplicationPublicResponse,
  UserBottleReservationNoticePublicResponse,
} from "@/apis/generated/api";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ReservationDetailClient from "./ReservationDetailClient";

const serverClock = vi.hoisted(() => ({
  now: new Date("2026-07-07T12:00:00.000Z").getTime(),
}));

vi.mock("@/components/ui/ImageWithFallback", () => ({
  ImageWithFallback: ({ alt }: { alt: string }) => <span aria-label={alt} role="img" />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/reservation/1",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("../../actions", () => ({
  applyBusinessReservation: vi.fn(),
  applyReservation: vi.fn(),
  cancelBusinessReservation: vi.fn(),
  cancelReservation: vi.fn(),
  updateBusinessReservation: vi.fn(),
  updateReservation: vi.fn(),
}));

vi.mock("../../_lib/useServerClock", () => ({
  useServerClock: () => ({
    getNow: () => serverClock.now,
    isSynced: true,
  }),
}));

describe("ReservationDetailClient", () => {
  afterEach(() => {
    vi.useRealTimers();
    serverClock.now = new Date("2026-07-07T12:00:00.000Z").getTime();
  });

  it("편집 중 예약이 종료되면 수정 폼을 닫고 신청 정보를 읽기 전용으로 표시한다", () => {
    vi.useFakeTimers();
    serverClock.now = new Date("2026-07-07T11:59:59.000Z").getTime();

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

    fireEvent.click(screen.getByRole("button", { name: "수정하기" }));
    expect(screen.getByRole("button", { name: "닫기" })).toBeInTheDocument();

    serverClock.now = new Date("2026-07-07T12:00:00.000Z").getTime();
    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(screen.queryByRole("button", { name: "닫기" })).not.toBeInTheDocument();
    expect(screen.getByText("1병 · 테스트 업장")).toBeInTheDocument();
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
    expect(screen.getByText("1병 · 테스트 업장")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "수정하기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "취소하기" })).not.toBeInTheDocument();
  });

  it("비즈니스 사용자는 픽업 업장 대신 신청 사업장을 선택한다", () => {
    render(
      <ReservationDetailClient
        notice={notice({
          reservationStartAt: "2026-07-07T10:00:00.000Z",
          reservationEndAt: "2026-07-07T13:00:00.000Z",
        })}
        pickupLocations={[]}
        myApplication={null}
        businessOptions={[
          {
            businessId: 20,
            businessName: "신청 사업장",
          },
        ]}
        selectedBusinessId={20}
      />,
    );

    expect(screen.getAllByText("신청 사업장").length).toBeGreaterThan(0);
    expect(screen.queryByText("수령 업장")).not.toBeInTheDocument();
    expect(screen.getByText(/픽업 장소는 관리자 설정에 따라 서버에서 확정/)).toBeInTheDocument();
  });

  it("확정된 비즈니스 신청에도 서버가 반환한 신청 사업장과 픽업 장소를 표시한다", () => {
    render(
      <ReservationDetailClient
        notice={notice({
          reservationStartAt: "2026-07-07T10:00:00.000Z",
          reservationEndAt: "2026-07-07T13:00:00.000Z",
        })}
        pickupLocations={[]}
        myApplication={application({
          status: "CONFIRMED",
          businessName: "신청 사업장",
          pickupBusinessName: "관리자 지정 픽업 업장",
          pickupAddress: "서울특별시 중구 테스트로 10",
        })}
        businessOptions={[
          {
            businessId: 20,
            businessName: "신청 사업장",
          },
        ]}
        selectedBusinessId={20}
      />,
    );

    expect(screen.getAllByText("신청 사업장")).toHaveLength(2);
    expect(screen.getByText("관리자 지정 픽업 업장")).toBeInTheDocument();
    expect(screen.getByText("서울특별시 중구 테스트로 10")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "수정하기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "취소하기" })).not.toBeInTheDocument();
  });

  it("선택 사업장 key가 바뀌면 이전 사업장의 로컬 신청 상태를 초기화한다", () => {
    const activeNotice = notice({
      reservationStartAt: "2026-07-07T10:00:00.000Z",
      reservationEndAt: "2026-07-07T13:00:00.000Z",
    });
    const businessOptions = [
      { businessId: 20, businessName: "A 사업장" },
      { businessId: 30, businessName: "B 사업장" },
    ];
    const { rerender } = render(
      <ReservationDetailClient
        key={20}
        notice={activeNotice}
        pickupLocations={[]}
        myApplication={application({ businessName: "A 사업장" })}
        businessOptions={businessOptions}
        selectedBusinessId={20}
      />,
    );

    expect(screen.getAllByText("A 사업장").length).toBeGreaterThan(0);

    rerender(
      <ReservationDetailClient
        key={30}
        notice={activeNotice}
        pickupLocations={[]}
        myApplication={null}
        businessOptions={businessOptions}
        selectedBusinessId={30}
      />,
    );

    expect(screen.queryByText("예약신청완료")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "예약하기" })).toBeInTheDocument();
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

function application(
  overrides: Partial<UserBottleReservationApplicationPublicResponse> = {},
): UserBottleReservationApplicationPublicResponse {
  return {
    id: 100,
    quantity: 1,
    pickupUserBusinessId: 10,
    pickupBusinessName: "테스트 업장",
    status: "APPLIED",
    ...overrides,
  };
}
