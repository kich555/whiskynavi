import type {
  BusinessBottleReservationApplicationPublicResponse,
  PickupLocationResponse,
  UserBottleReservationApplicationPublicResponse,
  UserBottleReservationNoticePublicResponse,
} from "@/apis/generated/api";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cancelBusinessReservation, updateBusinessReservation } from "../../actions";
import ReservationDetailClient from "./ReservationDetailClient";

const serverClock = vi.hoisted(() => ({
  now: new Date("2026-07-07T12:00:00.000Z").getTime(),
}));
const overlayController = vi.hoisted(() => ({
  open: vi.fn(),
}));

vi.mock("@/components/ui/ImageWithFallback", () => ({
  ImageWithFallback: ({ alt }: { alt: string }) => <span aria-label={alt} role="img" />,
}));

vi.mock("overlay-kit", () => ({
  overlay: overlayController,
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
    vi.clearAllMocks();
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
        businessApplications={[]}
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
        myApplication={null}
        businessApplications={[
          businessApplication({
            status: "CONFIRMED",
            businessName: "신청 사업장",
            pickupBusinessName: "관리자 지정 픽업 업장",
            pickupAddress: "서울특별시 중구 테스트로 10",
          }),
        ]}
        businessOptions={[
          {
            businessId: 20,
            businessName: "신청 사업장",
          },
        ]}
        selectedBusinessId={20}
      />,
    );

    expect(screen.getByRole("heading", { name: "사업장별 신청 내역" })).toBeInTheDocument();
    expect(screen.getByText("관리자 지정 픽업 업장")).toBeInTheDocument();
    expect(screen.getByText("서울특별시 중구 테스트로 10")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "신청 사업장 신청 수정" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "신청 사업장 신청 취소" })).not.toBeInTheDocument();
  });

  it("여러 사업장의 신청 내역과 수정·취소 버튼을 사업장별로 표시한다", () => {
    render(
      <ReservationDetailClient
        notice={notice({
          reservationStartAt: "2026-07-07T10:00:00.000Z",
          reservationEndAt: "2026-07-07T13:00:00.000Z",
        })}
        pickupLocations={[]}
        myApplication={null}
        businessApplications={[
          businessApplication({
            id: 100,
            businessId: 20,
            businessName: "A 사업장",
            pickupBusinessName: "A 픽업 장소",
          }),
          businessApplication({
            id: 200,
            businessId: 30,
            businessName: "B 사업장",
            pickupBusinessName: "B 픽업 장소",
          }),
        ]}
        businessOptions={[
          { businessId: 20, businessName: "A 사업장" },
          { businessId: 30, businessName: "B 사업장" },
        ]}
        selectedBusinessId={20}
      />,
    );

    expect(screen.getByText("2건")).toBeInTheDocument();
    expect(screen.getByText("A 사업장")).toBeInTheDocument();
    expect(screen.getByText("B 사업장")).toBeInTheDocument();
    expect(screen.getByText("A 픽업 장소")).toBeInTheDocument();
    expect(screen.getByText("B 픽업 장소")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A 사업장 신청 수정" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A 사업장 신청 취소" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "B 사업장 신청 수정" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "B 사업장 신청 취소" })).toBeInTheDocument();
  });

  it("신청하지 않은 사업장만 추가 신청 선택지로 표시한다", async () => {
    const user = userEvent.setup();

    render(
      <ReservationDetailClient
        notice={notice({
          reservationStartAt: "2026-07-07T10:00:00.000Z",
          reservationEndAt: "2026-07-07T13:00:00.000Z",
        })}
        pickupLocations={[]}
        myApplication={null}
        businessApplications={[
          businessApplication({
            businessId: 20,
            businessName: "신청 사업장",
          }),
        ]}
        businessOptions={[
          { businessId: 20, businessName: "신청 사업장" },
          { businessId: 30, businessName: "추가 사업장" },
        ]}
        selectedBusinessId={20}
      />,
    );

    const businessSelector = screen.getByRole("combobox", { name: "신청 사업장" });
    expect(businessSelector).toHaveTextContent("추가 사업장");

    await user.click(businessSelector);
    expect(screen.queryByRole("option", { name: "신청 사업장" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "추가 사업장" })).toBeInTheDocument();
  });

  it("신청 목록의 수정 버튼은 해당 사업장과 신청 ID로 수정한다", async () => {
    const user = userEvent.setup();
    vi.mocked(updateBusinessReservation).mockResolvedValue({
      success: true,
      application: businessApplication({ quantity: 2 }),
    });

    render(
      <ReservationDetailClient
        notice={notice({
          reservationStartAt: "2026-07-07T10:00:00.000Z",
          reservationEndAt: "2026-07-07T13:00:00.000Z",
        })}
        pickupLocations={[]}
        myApplication={null}
        businessApplications={[businessApplication()]}
        businessOptions={[{ businessId: 20, businessName: "신청 사업장" }]}
        selectedBusinessId={20}
      />,
    );

    await user.click(screen.getByRole("button", { name: "신청 사업장 신청 수정" }));
    fireEvent.change(screen.getByLabelText("신청 수량"), { target: { value: "2" } });
    await user.click(screen.getByRole("button", { name: "수정하기" }));

    expect(updateBusinessReservation).toHaveBeenCalledWith(1, 20, 100, 2);
    await waitFor(() => expect(screen.getByText("2병")).toBeInTheDocument());
  });

  it("신청 목록의 취소 버튼은 해당 사업장과 신청 ID로 취소한다", async () => {
    const user = userEvent.setup();
    vi.mocked(cancelBusinessReservation).mockResolvedValue({ success: true });

    render(
      <ReservationDetailClient
        notice={notice({
          reservationStartAt: "2026-07-07T10:00:00.000Z",
          reservationEndAt: "2026-07-07T13:00:00.000Z",
        })}
        pickupLocations={[]}
        myApplication={null}
        businessApplications={[businessApplication()]}
        businessOptions={[{ businessId: 20, businessName: "신청 사업장" }]}
        selectedBusinessId={20}
      />,
    );

    await user.click(screen.getByRole("button", { name: "신청 사업장 신청 취소" }));
    const renderOverlay = overlayController.open.mock.calls[0]?.[0] as (props: {
      isOpen: boolean;
      close: () => void;
    }) => ReactNode;
    render(renderOverlay({ isOpen: true, close: vi.fn() }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "취소하기" }));

    expect(cancelBusinessReservation).toHaveBeenCalledWith(1, 20, 100);
    await waitFor(() => expect(screen.getByText("신청한 사업장이 없습니다.")).toBeInTheDocument());
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

function businessApplication(
  overrides: Partial<BusinessBottleReservationApplicationPublicResponse> = {},
): BusinessBottleReservationApplicationPublicResponse {
  return {
    id: 100,
    noticeId: 1,
    noticeName: "테스트 공고명",
    bottleId: 1,
    bottleName: "테스트 보틀",
    bottleImgUrl: null,
    businessId: 20,
    businessName: "신청 사업장",
    quantity: 1,
    confirmedQuantity: null,
    pickupUserBusinessId: 20,
    pickupBusinessName: "신청 사업장",
    pickupAddress: null,
    pickupAssignmentType: "APPLICANT_BUSINESS_FALLBACK",
    status: "APPLIED",
    unitPrice: 10_000,
    totalPrice: 10_000,
    createdAt: "2026-07-07T10:00:00.000Z",
    updatedAt: null,
    ...overrides,
  };
}
