import {
  getApiBottlesReservationsApplicationsMe,
  getApiBottlesReservationsNoticesNoticeid,
} from "@/apis/generated/api";
import { getServerSession } from "next-auth";
import { describe, expect, it, vi } from "vitest";
import ReservationDetailPage from "./page";

vi.mock("@/apis/generated/api", () => ({
  getApiBottlesReservationsApplicationsMe: vi.fn().mockResolvedValue({
    data: { content: [] },
  }),
  getApiBottlesReservationsNoticesNoticeid: vi.fn().mockResolvedValue({
    data: { id: 7 },
  }),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token?: string) =>
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  ),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    accessToken: "user-token",
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("../_lib/fetchPickupLocations", () => ({
  fetchPickupLocations: vi.fn().mockResolvedValue([]),
}));

vi.mock("./_components/ReservationDetailClient", () => ({
  default: vi.fn(() => null),
}));

describe("ReservationDetailPage", () => {
  it("로그인 사용자의 예약 상세 요청에 Authorization 헤더를 포함한다", async () => {
    await ReservationDetailPage({
      params: Promise.resolve({ noticeId: "7" }),
    });

    expect(getServerSession).toHaveBeenCalled();
    expect(getApiBottlesReservationsNoticesNoticeid).toHaveBeenCalledWith(7, {
      headers: { Authorization: "Bearer user-token" },
    });
    expect(getApiBottlesReservationsApplicationsMe).toHaveBeenCalledWith(
      { noticeId: 7, size: 1 },
      { headers: { Authorization: "Bearer user-token" } },
    );
  });
});
