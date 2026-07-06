import {
  getApiBottlesReservationsNoticesNoticeid,
  postApiBottlesReservationsNoticesNoticeidApplications,
} from "@/apis/generated/api";
import { describe, expect, it, vi } from "vitest";
import { applyReservation } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  getApiBottlesReservationsNoticesNoticeid: vi.fn().mockResolvedValue({
    data: {
      id: 7,
      reservationStartAt: "2026-07-01T00:00:00.000Z",
      reservationEndAt: "2026-12-31T23:59:59.000Z",
    },
  }),
  postApiBottlesReservationsNoticesNoticeidApplications: vi.fn().mockResolvedValue({
    data: {},
  }),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token?: string) =>
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  ),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn().mockResolvedValue("user-token"),
}));

vi.mock("next/dist/client/components/redirect-error", () => ({
  isRedirectError: vi.fn(() => false),
}));

describe("applyReservation", () => {
  it("예약 신청 전 공고 상세 조회에 Authorization 헤더를 포함한다", async () => {
    const result = await applyReservation(7, 2, 33);

    expect(result).toEqual({ success: true });
    expect(getApiBottlesReservationsNoticesNoticeid).toHaveBeenCalledWith(7, {
      headers: { Authorization: "Bearer user-token" },
    });
    expect(postApiBottlesReservationsNoticesNoticeidApplications).toHaveBeenCalledWith(
      7,
      { quantity: 2, userBusinessId: 33 },
      { headers: { Authorization: "Bearer user-token" } },
    );
  });
});
