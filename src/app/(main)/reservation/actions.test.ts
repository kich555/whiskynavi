import {
  deleteApiBottlesReservationsApplicationsApplicationid,
  getApiBottlesReservationsNoticesNoticeid,
  putApiBottlesReservationsApplicationsApplicationid,
} from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cancelReservation, updateReservation } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  deleteApiBottlesReservationsApplicationsApplicationid: vi.fn(),
  getApiBottlesReservationsNoticesNoticeid: vi.fn(),
  postApiBottlesReservationsNoticesNoticeidApplications: vi.fn(),
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
