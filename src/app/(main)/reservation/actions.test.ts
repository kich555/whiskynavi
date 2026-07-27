import {
  deleteApiBottlesReservationsApplicationsApplicationid,
  deleteApiBusinessesBusinessidBottlesReservationsApplicationsApplicationid,
  getApiBottlesReservationsNoticesNoticeid,
  postApiBusinessesBusinessidBottlesReservationsNoticesNoticeidApplications,
  putApiBottlesReservationsApplicationsApplicationid,
} from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyBusinessReservation, cancelBusinessReservation, cancelReservation, updateReservation } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  deleteApiBusinessesBusinessidBottlesReservationsApplicationsApplicationid: vi.fn(),
  deleteApiBottlesReservationsApplicationsApplicationid: vi.fn(),
  getApiBottlesReservationsNoticesNoticeid: vi.fn(),
  postApiBusinessesBusinessidBottlesReservationsNoticesNoticeidApplications: vi.fn(),
  postApiBottlesReservationsNoticesNoticeidApplications: vi.fn(),
  putApiBusinessesBusinessidBottlesReservationsApplicationsApplicationid: vi.fn(),
  putApiBottlesReservationsApplicationsApplicationid: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token: string) => ({ token })),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedGetNotice = vi.mocked(getApiBottlesReservationsNoticesNoticeid);
const mockedApplyBusinessApplication = vi.mocked(
  postApiBusinessesBusinessidBottlesReservationsNoticesNoticeidApplications,
);
const mockedCancelBusinessApplication = vi.mocked(
  deleteApiBusinessesBusinessidBottlesReservationsApplicationsApplicationid,
);
const mockedUpdateApplication = vi.mocked(putApiBottlesReservationsApplicationsApplicationid);
const mockedCancelApplication = vi.mocked(deleteApiBottlesReservationsApplicationsApplicationid);

describe("reservation actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("user-token");
  });

  it("예약 종료 후 사용자 수정은 종료 안내 메시지를 반환한다", async () => {
    mockedGetNotice.mockResolvedValue({
      data: closedNotice(),
      status: 200,
      headers: new Headers(),
    } as Awaited<ReturnType<typeof getApiBottlesReservationsNoticesNoticeid>>);

    await expect(updateReservation(1, 10, 1, 100)).resolves.toEqual({
      success: false,
      error: "예약이 종료된 후에는 수정/취소가 불가능합니다.",
    });
    expect(mockedUpdateApplication).not.toHaveBeenCalled();
  });

  it("예약 종료 후 사용자 취소는 종료 안내 메시지를 반환한다", async () => {
    mockedGetNotice.mockResolvedValue({
      data: closedNotice(),
      status: 200,
      headers: new Headers(),
    } as Awaited<ReturnType<typeof getApiBottlesReservationsNoticesNoticeid>>);

    await expect(cancelReservation(1, 10)).resolves.toEqual({
      success: false,
      error: "예약이 종료된 후에는 수정/취소가 불가능합니다.",
    });
    expect(mockedCancelApplication).not.toHaveBeenCalled();
  });

  it("예약 시작 전 사용자 수정 시도도 같은 불가 메시지를 반환한다", async () => {
    mockedGetNotice.mockResolvedValue({
      data: pendingNotice(),
      status: 200,
      headers: new Headers(),
    } as Awaited<ReturnType<typeof getApiBottlesReservationsNoticesNoticeid>>);

    await expect(updateReservation(1, 10, 1, 100)).resolves.toEqual({
      success: false,
      error: "예약이 종료된 후에는 수정/취소가 불가능합니다.",
    });
    expect(mockedUpdateApplication).not.toHaveBeenCalled();
  });

  it("예약 시작 전 사용자 취소 시도도 같은 불가 메시지를 반환한다", async () => {
    mockedGetNotice.mockResolvedValue({
      data: pendingNotice(),
      status: 200,
      headers: new Headers(),
    } as Awaited<ReturnType<typeof getApiBottlesReservationsNoticesNoticeid>>);

    await expect(cancelReservation(1, 10)).resolves.toEqual({
      success: false,
      error: "예약이 종료된 후에는 수정/취소가 불가능합니다.",
    });
    expect(mockedCancelApplication).not.toHaveBeenCalled();
  });

  it("비즈니스 예약 신청은 신청 사업장 경로와 수량만 전송한다", async () => {
    mockedGetNotice.mockResolvedValue({
      data: activeNotice(),
      status: 200,
      headers: new Headers(),
    } as Awaited<ReturnType<typeof getApiBottlesReservationsNoticesNoticeid>>);
    mockedApplyBusinessApplication.mockResolvedValue({
      data: {
        id: 30,
        businessId: 20,
        businessName: "신청 사업장",
        pickupUserBusinessId: 40,
        pickupBusinessName: "관리자 픽업 업장",
        pickupAssignmentType: "ADMIN_DESIGNATED",
      },
      status: 201,
      headers: new Headers(),
    });

    const result = await applyBusinessReservation(10, 20, 2);

    expect(result.success).toBe(true);
    expect(mockedApplyBusinessApplication).toHaveBeenCalledWith(20, 10, { quantity: 2 }, { token: "user-token" });
  });

  it("비즈니스 예약 취소는 신청 사업장 소유권 경로를 사용한다", async () => {
    mockedGetNotice.mockResolvedValue({
      data: activeNotice(),
      status: 200,
      headers: new Headers(),
    } as Awaited<ReturnType<typeof getApiBottlesReservationsNoticesNoticeid>>);
    mockedCancelBusinessApplication.mockResolvedValue({
      data: true,
      status: 200,
      headers: new Headers(),
    });

    await expect(cancelBusinessReservation(10, 20, 30)).resolves.toEqual({ success: true });
    expect(mockedCancelBusinessApplication).toHaveBeenCalledWith(20, 30, { token: "user-token" });
  });
});

function closedNotice() {
  return {
    id: 1,
    maxOrderQuantity: 2,
    reservationStartAt: "2000-01-01T00:00:00.000Z",
    reservationEndAt: "2000-01-02T00:00:00.000Z",
  };
}

function pendingNotice() {
  return {
    id: 1,
    maxOrderQuantity: 2,
    reservationStartAt: "2999-01-01T00:00:00.000Z",
    reservationEndAt: "2999-01-02T00:00:00.000Z",
  };
}

function activeNotice() {
  return {
    id: 1,
    maxOrderQuantity: 2,
    reservationStartAt: "2000-01-01T00:00:00.000Z",
    reservationEndAt: "2999-01-02T00:00:00.000Z",
  };
}
